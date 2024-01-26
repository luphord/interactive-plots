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

OptionChart.prototype.getPayoffAttrs = function () {
    return {
        straightFirst: false,
        straightLast: false,
        strokecolor: 'grey',
        strokewidth: 2
    };
};

OptionChart.prototype.addCall = function () {
    const color = this.nextColor();
    const inTheMoneyAttrs = this.getPayoffAttrs();
    inTheMoneyAttrs.strokecolor = color;
    const outOfTheMoneyAttrs = this.getPayoffAttrs();
    outOfTheMoneyAttrs.straightLast = true;
    outOfTheMoneyAttrs.strokecolor = color;

    let strike = board.create('glider',
        [100, 0, this.xAxisPositive],
        { face: '<>', size: 7, name: 'strike' }
    );
    let payoff = board.create('group',
        [
            board.create('line',
                [[0, 0], [() => strike.X(), 0]],
                inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X() + 100, 100]],
                outOfTheMoneyAttrs
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
};