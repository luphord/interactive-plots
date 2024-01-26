var OptionChart = function (board) {
    if (this === window) {
        throw new Error("OptionChart needs to be created using the 'new' keyword!");
    }

    this.seed = 1;
    this.board = board;
    this.options = [];
    this.xAxisPositive = board.create('line',
        [[0.00001, 0], [100, 0]],
        { visible: false, straightFirst: false }
    );
    this.volatility = board.create('slider',
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
    for (let i = 0; i < this.options.length; i++) {
        sum += this.options[i].npv(spot);
    }
    return sum;
};

OptionChart.prototype.random = function () {
    let x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
}

OptionChart.prototype.nextColor = function () {
    return JXG.hsv2rgb(this.random() * 360, 0.9, 0.8) + 'AA';
};

OptionChart.prototype.getOptionPayoffLineAttrs = function () {
    return {
        straightFirst: false,
        straightLast: false,
        strokecolor: 'grey',
        strokewidth: 2
    };
};

OptionChart.prototype.getOptionPayoffAttrs = function () {
    const color = this.nextColor();
    const inTheMoneyAttrs = this.getOptionPayoffLineAttrs();
    inTheMoneyAttrs.strokecolor = color;
    const outOfTheMoneyAttrs = this.getOptionPayoffLineAttrs();
    outOfTheMoneyAttrs.straightLast = true;
    outOfTheMoneyAttrs.strokecolor = color;
    return {
        inTheMoneyAttrs: inTheMoneyAttrs,
        outOfTheMoneyAttrs: outOfTheMoneyAttrs
    }
};

OptionChart.prototype._createStrike = function (initialStrike) {
    return board.create('glider',
        [initialStrike, 0, this.xAxisPositive],
        { face: '<>', size: 7, name: 'strike' }
    );
};

OptionChart.prototype.addCall = function () {
    const attrs = this.getOptionPayoffAttrs();

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

    this.options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => eqBlackScholes(
            spot,
            strike.X(),
            1,
            this.volatility.Value(),
            0,
            0
        ).call.price
    });
    this.board.update();
};

OptionChart.prototype.addPut = function () {
    const attrs = this.getOptionPayoffAttrs();

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

    this.options.push({
        strike: strike,
        payoff: payoff,
        npv: (spot) => eqBlackScholes(
            spot,
            strike.X(),
            1,
            this.volatility.Value(),
            0,
            0
        ).put.price
    });
    this.board.update();
};