const InteractivePlot = function(container) {
    this.container = container;
    this.sliders = [];
    this.charts = [];
    this.vars = {};
  };
  
  InteractivePlot.prototype.createSlider = function(name, min, max, value) {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.value = value;
    const that = this;
    slider.oninput = function() {
      that.vars[name] = this.value;
      that.redraw();
    };
    this.vars[name] = slider.value;
    this.container.appendChild(slider);
    this.container.appendChild(document.createElement("br"))
    this.sliders.push(slider);
    return slider;
  };
  
  InteractivePlot.prototype.createLineChart = function(options, updateFunction) {
    const div = document.createElement("div");
    div.classList.add(".ct-chart");
    div.classList.add("ct-perfect-fourth");
    this.container.appendChild(div);
    const chart = new Chartist.Line(div, {}, options);
    this.charts.push({
      "chart": chart,
      "updateFunction": updateFunction
    });
    return chart;
  };
  
  InteractivePlot.prototype.redraw = function() {
    for (let i = 0; i < this.charts.length; i++) {
      this.charts[i].updateFunction(this.charts[i].chart, this.vars);
    }
  };
  
  // helpers
  
  const linspace = function(start, stop, n) {
    x = [];
    for (let i = 0; i < n; i++) {
      x.push(start + i / (n - 1) * (stop - start))
    }
    return x;
  }