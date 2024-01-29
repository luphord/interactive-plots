var OptionChart = function (board) {
    if (this === window) {
        throw new Error("OptionChart needs to be created using the 'new' keyword!");
    }

    this._seed = 1;
    this._colorOffset = 0;
    this._strikeControlOffset = 20;
    this._board = board;
    this._options = [];
    const optionUndefined = { price: undefined };
    this._errorObject = {
        call: optionUndefined,
        put: optionUndefined,
        digitalCall: optionUndefined,
        digitalPut: optionUndefined
    };
    const controlsX = -40;
    this._volatility = board.create('slider',
        [[controlsX, 50], [-40, 90], [0, 0.1, 1.23]],
        { name: 'volatility' }
    );
    board.create('button', [controlsX, 40, 'Call', () => this.addCall()]);
    board.create('button', [controlsX, 30, 'Put', () => this.addPut()]);
    board.create('button', [controlsX, 20, 'Up Digi', () => this.addDigitalCall()]);
    board.create('button', [controlsX, 10, 'Down Digi', () => this.addDigitalPut()]);

    const optionPriceAttrs = {
        strokecolor: 'orange',
        strokewidth: 3,
        layer: 20
    };
    board.create('functiongraph',
        [
            spot => this.npv(spot),
            0,
            1000
        ],
        optionPriceAttrs
    );
    board.on('move', () => this._onUpdate());
};

OptionChart.prototype._onUpdate = function () {
    this._board.suspendUpdate();
    for (let i = 0; i < this._options.length; i++) {
        const control = this._options[i].control;
        control.moveTo([
            Math.max(this._options[i].minControl + 0.00001, control.X()),
            control.Y()
        ]);
    }
    this._board.unsuspendUpdate();
};

OptionChart.prototype.npv = function (spot) {
    let sum = 0.0;
    for (let i = 0; i < this._options.length; i++) {
        sum += this._options[i].npv(spot);
    }
    return sum;
};

OptionChart.prototype._eqBlackScholes = function (strike, spot, participation) {
    try {
        return eqBlackScholes(
            spot,
            strike,
            1,
            this._volatility.Value(),
            0,
            0,
            participation
        );
    }
    catch {
        return this._errorObject;
    }
};

OptionChart.prototype._random = function () {
    let x = Math.sin(this._seed++) * 10000;
    return x - Math.floor(x);
};

OptionChart.prototype._nextColor = function () {
    return JXG.hsv2rgb(this._colorOffset++ * 65, 0.9, 0.8) + 'AA';
};

OptionChart.prototype._getOptionPayoffLineAttrs = function () {
    return {
        straightFirst: false,
        straightLast: false,
        strokecolor: 'grey',
        strokewidth: 2
    };
};

OptionChart.prototype._getOptionPayoffAttrs = function () {
    const color = this._nextColor();
    const inTheMoneyAttrs = this._getOptionPayoffLineAttrs();
    inTheMoneyAttrs.strokecolor = color;
    const outOfTheMoneyAttrs = this._getOptionPayoffLineAttrs();
    outOfTheMoneyAttrs.straightLast = true;
    outOfTheMoneyAttrs.strokecolor = color;
    const discontinuityAttrs = this._getOptionPayoffLineAttrs();
    discontinuityAttrs.strokecolor = color;
    discontinuityAttrs.dash = 1;
    return {
        inTheMoneyAttrs: inTheMoneyAttrs,
        outOfTheMoneyAttrs: outOfTheMoneyAttrs,
        discontinuityAttrs: discontinuityAttrs
    }
};

OptionChart.prototype._createControl = function (color, x0, y0) {
    return board.create('point',
        [x0, y0],
        { face: 'o', strokecolor: color, fillcolor: color, size: 6, name: '' }
    );
};

OptionChart.prototype.addCall = function () {
    const attrs = this._getOptionPayoffAttrs();

    const control = this._createControl(
        attrs.inTheMoneyAttrs.strokecolor,
        110 + this._strikeControlOffset,
        this._strikeControlOffset);
    const strike = () => control.X() - this._strikeControlOffset;
    const participation = () => control.Y() / this._strikeControlOffset;
    const payoff = board.create('group',
        [
            control,
            board.create('line',
                [[0, 0], [strike, 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[strike, 0], [() => control.X(), () => control.Y()]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        control: control,
        minControl: this._strikeControlOffset,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike(), spot, participation()).call.price
    });
    this._board.update();
};

OptionChart.prototype.addPut = function () {
    const attrs = this._getOptionPayoffAttrs();

    const control = this._createControl(
        attrs.inTheMoneyAttrs.strokecolor,
        90 - this._strikeControlOffset,
        this._strikeControlOffset);
    const strike = () => control.X() + this._strikeControlOffset;
    const participation = () => control.Y() / this._strikeControlOffset;
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, () => control.Y() * strike() / this._strikeControlOffset], [strike, 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike, 0], [() => strike + 100, 0]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        control: control,
        minControl: -this._strikeControlOffset,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike(), spot, participation()).put.price
    });
    this._board.update();
};

OptionChart.prototype.addDigitalCall = function () {
    const attrs = this._getOptionPayoffAttrs();

    const notional = 20;
    const control = this._createControl(
        attrs.inTheMoneyAttrs.strokecolor,
        120,
        notional);
    const participation = () => control.Y() / notional;
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, 0], [() => control.X(), 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => control.X(), 0], [() => control.X(), () => control.Y()]],
                attrs.discontinuityAttrs
            ),
            board.create('line',
                [[() => control.X(), () => control.Y()], [() => control.X() + 100, () => control.Y()]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        control: control,
        minControl: 0,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(control.X(), spot, participation()).digitalCall.price * notional
    });
    this._board.update();
};

OptionChart.prototype.addDigitalPut = function () {
    const attrs = this._getOptionPayoffAttrs();

    const notional = 20;
    const control = this._createControl(
        attrs.inTheMoneyAttrs.strokecolor,
        80,
        notional);
    const participation = () => control.Y() / notional;
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, () => control.Y()], [() => control.X(), () => control.Y()]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => control.X(), () => control.Y()], [() => control.X(), 0]],
                attrs.discontinuityAttrs
            ),
            board.create('line',
                [[() => control.X(), 0], [() => control.X() + 100, 0]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        control: control,
        minControl: 0,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(control.X(), spot, participation()).digitalPut.price * notional
    });
    this._board.update();
};