var OptionChart = function (board) {
    if (this === window) {
        throw new Error("OptionChart needs to be created using the 'new' keyword!");
    }

    this._seed = 1;
    this._colorOffset = 0;
    this._board = board;
    this._options = [];
    this._xAxisPositive = board.create('line',
        [[0.00001, 0], [100, 0]],
        { visible: false, straightFirst: false }
    );
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
};

OptionChart.prototype.npv = function (spot) {
    let sum = 0.0;
    for (let i = 0; i < this._options.length; i++) {
        sum += this._options[i].npv(spot);
    }
    return sum;
};

OptionChart.prototype._eqBlackScholes = function (strike, spot) {
    return eqBlackScholes(
        spot,
        strike.X(),
        1,
        this._volatility.Value(),
        0,
        0
    );
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

OptionChart.prototype._createStrike = function (color, initialStrike) {
    return board.create('glider',
        [initialStrike, 0, this._xAxisPositive],
        { face: '<>', strokecolor: color, fillcolor: color, size: 7, name: 'strike' }
    );
};

OptionChart.prototype.addCall = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(attrs.inTheMoneyAttrs.strokecolor, 110);
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, 0], [() => strike.X(), 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X() + 100, 100]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike, spot).call.price
    });
    this._board.update();
};

OptionChart.prototype.addPut = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(attrs.inTheMoneyAttrs.strokecolor, 90);
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, () => strike.X()], [() => strike.X(), 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X() + 100, 0]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike, spot).put.price
    });
    this._board.update();
};

OptionChart.prototype.addDigitalCall = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(attrs.inTheMoneyAttrs.strokecolor, 120);
    const notional = 20;
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, 0], [() => strike.X(), 0]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X(), notional]],
                attrs.discontinuityAttrs
            ),
            board.create('line',
                [[() => strike.X(), notional], [() => strike.X() + 100, notional]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike, spot).digitalCall.price * notional
    });
    this._board.update();
};

OptionChart.prototype.addDigitalPut = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(attrs.inTheMoneyAttrs.strokecolor, 80);
    const notional = 20;
    const payoff = board.create('group',
        [
            board.create('line',
                [[0, notional], [() => strike.X(), notional]],
                attrs.inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), notional], [() => strike.X(), 0]],
                attrs.discontinuityAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X() + 100, 0]],
                attrs.outOfTheMoneyAttrs
            )
        ]
    );

    this._options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => this._eqBlackScholes(strike, spot).digitalPut.price * notional
    });
    this._board.update();
};