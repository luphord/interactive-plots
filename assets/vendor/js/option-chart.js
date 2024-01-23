var OptionChart = function (board) {
    if (this === window) {
        throw new Error("OptionChart needs to be created using the 'new' keyword!");
    }

    this.board = board;
    this.npvs = [];
    this.maxSpots = []
    this.xAxisPositive = board.create('line',
        [[0.00001, 0], [100, 0]],
        { visible: false, straightFirst: false }
    );
    this.volatility = board.create('slider',
        [[10, 70], [70, 70], [0, 0.1, 1]],
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
            () => this.maxSpot()
        ],
        optionPriceAttrs
    );
};

OptionChart.prototype._maxSpot = function (K, T, sigma, q, r) {
    const factor = 1.8; // determined by observation
    return K * Math.exp(factor * sigma * Math.sqrt(T) - (r - q - sigma * sigma / 2) * T);
};

OptionChart.prototype.maxSpot = function () {
    let max = 100;
    for (let i = 0; i < this.maxSpots.length; i++) {
        max = Math.max(max, this.maxSpots[i]());
    }
    return max;
};

OptionChart.prototype.npv = function (spot) {
    let sum = 0.0;
    for (let i = 0; i < this.npvs.length; i++) {
        sum += this.npvs[i](spot);
    }
    return sum;
};

OptionChart.prototype.addCall = function () {
    const inTheMoneyAttrs = {
        straightFirst: false,
        straightLast: false,
        strokecolor: 'grey',
        strokewidth: 3
    };
    const outOfTheMoneyAttrs = {
        straightFirst: false,
        straightLast: true,
        strokecolor: 'grey',
        strokewidth: 3
    };
    var strike = board.create('glider',
        [100, 0, this.xAxisPositive],
        { face: '<>', size: 7, name: 'strike' }
    );
    board.create('group',
        [
            board.create('line',
                [[0, 0], [() => strike.X(), 0]],
                inTheMoneyAttrs
            ),
            board.create('line',
                [[() => strike.X(), 0], [() => strike.X() + 100, 100]],
                outOfTheMoneyAttrs
            )
        ]);

    this.npvs.push((spot) => eqBlackScholes(
        spot,
        strike.X(),
        1,
        this.volatility.Value(),
        0,
        0
    ).call.price);
    this.maxSpots.push(() => this._maxSpot(strike.X(), 1, this.volatility.Value(), 0, 0));
};