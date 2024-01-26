var OptionChart = function (board) {
    if (this === window) {
        throw new Error("OptionChart needs to be created using the 'new' keyword!");
    }

    this._seed = 1;
    this._board = board;
    this._options = [];
    this._xAxisPositive = board.create('line',
        [[0.00001, 0], [100, 0]],
        { visible: false, straightFirst: false }
    );
    this._volatility = board.create('slider',
        [[-40, 20], [-40, 80], [0, 0.1, 1.23]],
        { name: 'volatility' }
    );

    const optionPriceAttrs = {
        strokecolor: 'orange',
        strokewidth: 3
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

OptionChart.prototype._random = function () {
    let x = Math.sin(this._seed++) * 10000;
    return x - Math.floor(x);
}

OptionChart.prototype._nextColor = function () {
    return JXG.hsv2rgb(this._random() * 360, 0.9, 0.8) + 'AA';
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
    return {
        inTheMoneyAttrs: inTheMoneyAttrs,
        outOfTheMoneyAttrs: outOfTheMoneyAttrs
    }
};

OptionChart.prototype._createStrike = function (initialStrike) {
    return board.create('glider',
        [initialStrike, 0, this._xAxisPositive],
        { face: '<>', size: 7, name: 'strike' }
    );
};

OptionChart.prototype.addCall = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(110);
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
        npv: (spot) => eqBlackScholes(
            spot,
            strike.X(),
            1,
            this._volatility.Value(),
            0,
            0
        ).call.price
    });
    this._board.update();
};

OptionChart.prototype.addPut = function () {
    const attrs = this._getOptionPayoffAttrs();

    const strike = this._createStrike(90);
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
        npv: (spot) => eqBlackScholes(
            spot,
            strike.X(),
            1,
            this._volatility.Value(),
            0,
            0
        ).put.price
    });
    this._board.update();
};