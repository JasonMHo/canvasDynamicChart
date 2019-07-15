window.onload = function() {
	startdiagram();
};


var t = 1;
var v;
var aDiagram = [];
var ts = timestamp();
var tHypotoxic = 0;
var indextotal = 0;

// @param  {float} t	x坐标. (时间)
// @param  {float} v	y坐标. (值)
function Messwert(t, v) {
	this.t = t;
	this.v = v;
}

//创建一个Diagram对象，用于在Canvas元素中绘图。
//* @param {string}	canvas		    Canvas Elements.
//* @param {string}	yAxisCanvas		Y-Axis Canvas Elements.
//* @param {float}	ts				Timestamp  T0 mit (x=0)
//* @param {array}	foreColor		前景色的颜色值数组
//* @param {array}	backColor		背景颜色的颜色值数组
//* @param {array}	lineColor		线条颜色的颜色值数组
//* @param {float}	minVal			最小 Y 值.
//* @param {float}	maxVal			最大 Y 值.
//* @param {float}	deltaValLine	显示所有x Y值的行
//* @param {int}	 cntThickLineY	Y线的厚度
//* @param {int}	 anzahlKanaele	要绘制的行数。

function Diagram(canvas, yAxisCanvas, ts, foreColor, backColor, lineColor, minVal, maxVal, deltaValLine, cntThickLineY, anzahlKanaele) {

	// 变量
	this.canvas = document.getElementById(canvas);
	this.yAxisCanvas = document.getElementById(yAxisCanvas);
	this.context = this.canvas.getContext('2d');
	this.yAxisContext = this.yAxisCanvas.getContext('2d');
	this.foreColor = foreColor;
	this.backColor = backColor;
	this.lineColor = lineColor;

	this.mIndex = -1;
	this.messwerte = new Array();
	this.deltaT = 60;
	this.tStart = ts; // Unix Timestamp
	this.tStartAbsolut = ts; // Unix Timestamp
	this.tEnd = this.tStart + this.deltaT; // Unix Timestamp	
	this.deltaTLine = 1; 
	this.cntThickLineX = 5; // 每一行都画得很厚 + 轴标签
	this.maxTimeoutBeforeInterrupt = 1.01; //在x秒之后，线路被中断//1.01

	this.minVal = minVal;
	this.maxVal = maxVal;
	this.deltaValLine = deltaValLine;
	this.cntThickLineY = cntThickLineY;
	this.deltaVal = this.maxVal - this.minVal;

	this.values = 10; // 可显示值的数量
	this.tGridPositions = new Array();
	this.tBoldGridPositions = new Array();
	this.valueGridPositions = new Array();
	this.valueBoldGridPositions = new Array();

	this.anzahlKanaele = anzahlKanaele;


	this.reDraw = function reDraw() {
		var i = 0;
		while (this.messwerte[i].t < this.tStart) {
			i++;
		}
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); 
		this.drawGrid();
		var maxIndex = this.mIndex;
		this.mIndex = i - 1;
		while (this.mIndex < maxIndex) {
			this.mIndex++;
			this.drawGraph();
		}
	}
	this.reSize = function reSize(deltaT, deltaTLine, cntThickLineX) {
		this.deltaT = deltaT;
		this.deltaTLine = deltaTLine;
		this.cntThickLineX = cntThickLineX;
		var t = this.messwerte[this.mIndex].t - this.tStartAbsolut;
		this.tStart = Math.floor(t / this.deltaT) * this.deltaT + this.tStartAbsolut;
		this.tEnd = this.tStart + this.deltaT; // Unix Timestamp	
		this.reDraw();
	}

	
	 //绘制网格
	this.drawGrid = function drawGrid(t1, t2) {

		if (typeof t1 == 'undefined') {
			t1 = this.tStart;
		}
		if (typeof t2 == 'undefined') {
			t2 = this.tEnd;
		}

		var t = this.tStart + this.deltaTLine;
		var i = 1;
		// 垂直线条
		while (t < this.tEnd) {
			if (t >= t1 && t <= t2) {
				var xPos = this.tToX(t);

				// 每个cntThickLineX。出现第二个文本的位置
				// 该线将绘制两次
				if ((i % this.cntThickLineX) == 0) {
					drawLine(this.context, xPos - 1, 0, xPos - 1, this.canvas.height, this.lineColor, 1);
				}
			}
			t += this.deltaTLine;
			i += 1;
		}
		var val = this.minVal;
		i = 0;
		var xMin = this.tToX(t1);
		var xMax = this.tToX(t2);
		//水平线
		while (val < this.maxVal) {
			var yPos = this.valToY(val);
			// 每个cntThickLineY。显示值文本的点
			// 该线将绘制两次
			if ((i % this.cntThickLineY) == 0 && i > 0) {			
				drawLine(this.context, xMin, yPos - 1, xMax, yPos - 1, this.lineColor, 1);
			}
			val += this.deltaValLine;
			i += 1;
		}
	}

	
	 //标记y轴。绘Y轴的值。
	this.drawYValues = function drawYValues() {

		var val = this.minVal;
		var i = 0;
		// 水平线
		while (val <= this.maxVal) {
			var yPos = this.valToY(val) + 10;
			if ((i % this.cntThickLineY) == 0) {
				var tX = ((this.yAxisCanvas.width - 10) / 2) + 20;
				putText(this.yAxisContext, tX, yPos + 4, 12, val);
				if (i > 0 && val < this.maxVal) {
					drawLine(this.yAxisContext, 37, yPos, this.yAxisCanvas.width, yPos, this.lineColor, 1);
				}
			}


			val += this.deltaValLine;
			i += 1;
		}
	}


	//返回指定时间值的对应像素位置。
	//@param	{Integer}	t	时间值为Unix Timestamp.
	this.tToX = function tToX(t) {
		var x = (t - this.tStart) / this.deltaT * this.canvas.width;
		return x;
	}

	//返回指定值的相应像素位置。
	// @param	{Integer}	val应查询Y位置的值。
	this.valToY = function valToY(val) {
		var y = (1 - (val - this.minVal) / this.deltaVal) * this.canvas.height;
		return y;
	}


	 //画线从上次阅读到阅读
	this.drawGraph = function drawGraph() {
		
		if (this.messwerte[this.mIndex - 1] != null) {
			this.moveClear(this.messwerte[this.mIndex - 1], this.messwerte[this.mIndex]);
			for (var k = 0; k < this.anzahlKanaele; k++) {
				if (this.messwerte[this.mIndex - 1].v[k] != null) {
					if(k === 1 || (this.messwerte[this.mIndex].t - this.messwerte[this.mIndex - 1].t) <= this.maxTimeoutBeforeInterrupt) {
						drawLine(this.context, this.tToX(this.messwerte[this.mIndex - 1].t), this.valToY(this.messwerte[this.mIndex - 1].v[k]),
							this.tToX(this.messwerte[this.mIndex].t), this.valToY(this.messwerte[this.mIndex].v[k]), this.foreColor[k], 2-k);
					}
				}
				if (k == 0) {
					this.clip(this.messwerte[this.mIndex - 1].t, this.messwerte[this.mIndex].t, this.messwerte[this.mIndex - 1].v[k], this.messwerte[this.mIndex].v[k]);
				}
			}
		}
	}

	this.reOrg = function reOrg() {
		var limit = 10000;
		if (this.mIndex >= limit - 1) {
			var nMesswerte = new Array();
			for (var i = 0; i < (limit / 2); i++) {
				nMesswerte.push(this.messwerte[i + (limit / 2)]);
			}
			this.messwerte = nMesswerte;
			this.mIndex = (limit / 2) - 1;
		}
	}

	//清除曲线的下一部分并移动位置栏。
	this.moveClear = function moveClear(lastMesswert, messwert) {
									
		var x1 = this.tToX(lastMesswert.t);
		var x2 = this.tToX(messwert.t);
		this.context.clearRect(x1, 0, x2 - x1 + 8, this.canvas.height); //parseInt
		this.drawGrid(lastMesswert.t, messwert.t);
		drawLine(this.context, x2 + 2, 0, x2 + 2, this.canvas.height, '#656565', 2);
	}

	this.clip = function clip(vx1, vx2, vy1, vy2) {
		var vymax = this.maxVal;
		var vymin = this.minVal;
		var x1 = null;
		var x2 = null;
		var y = null;

		if (vy2 > vymax && vy1 <= vymax) // 值从下往上到上限
		{
			x1 = this.tToX(vx1 + (vymax - vy1) / (vy2 - vy1) * (vx2 - vx1));
			x2 = this.tToX(vx2);
			y = this.valToY(vymax);
		}
		if (vy2 > vymax && vy1 > vymax) // 值高于上限
		{
			x1 = this.tToX(vx1);
			x2 = this.tToX(vx2);
			y = this.valToY(vymax);
		}
		if (vy1 > vymax && vy2 <= vymax) // 值从上到下通过上限
		{
			x1 = this.tToX(vx1);
			x2 = this.tToX(vx1 + (vymax - vy1) / (vy2 - vy1) * (vx2 - vx1));
			y = this.valToY(vymax);
		}
		if (vy2 < vymin && vy1 >= vymin) // 值从上到下通过下限
		{
			x1 = this.tToX(vx1 + (vymin - vy1) / (vy2 - vy1) * (vx2 - vx1));
			x2 = this.tToX(vx2);
			y = this.valToY(vymin);
		}
		if (vy2 < vymin && vy1 < vymin) // 值低于下限
		{
			x1 = this.tToX(vx1);
			x2 = this.tToX(vx2);
			y = this.valToY(vymin);
		}
		if (vy2 >= vymin && vy1 < vymin) // 值从下到上通过下限
		{
			x1 = this.tToX(vx1);
			x2 = this.tToX(vx1 + (vymin - vy1) / (vy2 - vy1) * (vx2 - vx1));
			y = this.valToY(vymin);
		}
		if (y != null)
		{
			drawLine(this.context, x1, y, x2, y, 'red', 6);
		}
	}
}

function drawXValues(diagram, t1, t2) {

	xCanvas = document.getElementById('myTAxisCanvas');
	xContext = xCanvas.getContext('2d');
	if (typeof t1 == 'undefined') {
		t1 = diagram.tStart;
	}
	if (typeof t2 == 'undefined') {
		t2 = diagram.tEnd;
	}
	var t = diagram.tStart;
	var i = 0;
	//垂直线条
	while (t <= diagram.tEnd) {
		if (t >= t1 && t <= t2) {
			var xPos = diagram.tToX(t) + 42;
			var xMin = diagram.tToX(t - (diagram.deltaTLine * diagram.cntThickLineX) / 2) + 42;
			var xMax = diagram.tToX(t + (diagram.deltaTLine * diagram.cntThickLineX) / 2) + 42;
			// 每个cntThickLineX。出现第二个文本的位置
			// 该线将绘制两次
			if ((i % diagram.cntThickLineX) == 0) {
				var dispt = parseTimeFormat(t - diagram.tStartAbsolut);
				xContext.clearRect(xMin - 1, 0, xMax - xMin + 2, xCanvas.height); //parseInt
				putText(xContext, xPos, 18, 12, dispt, 'center');
				if (t != diagram.tStart && t != diagram.tEnd) {
					drawLine(xContext, xPos - 1, 0, xPos - 1, 5, diagram.lineColor, 1);
				}
			}
		}
		t += diagram.deltaTLine;
		i += 1;
	}
}



 //划一条线
 //@param	{Object}	context			绘制画布的上下文。
 //@param	{Integer}	intMoveX		线的x起始位置。
 //@param	{Integer}	intMoveY		线的y起始位置。
 //@param	{Integer}	intDestX		线的x目标位置。
 //@param	{Integer}	intDestY		线的y目标位置。
 //@param	{String}	strColor		线条颜色为CSS HEX颜色值。
 //@param	{Integer}	lineWidth		线条宽度。
function drawLine(context, intMoveX, intMoveY, intDestX, intDestY, strColor, lineWidth) {

	if (typeof lineWidth == 'undefined') {
		lineWidth = 1;
	}

	context.beginPath();
	context.moveTo(intMoveX, intMoveY); //parseInt
	context.lineTo(intDestX, intDestY); //parseInt
	context.strokeStyle = strColor;
	context.lineWidth = lineWidth;
	context.stroke();
}



// 定位指定的文本。
// @param	{Object}	context		绘制画布的上下文。
// @param	{Integer}	x			文本的x位置。
// @param	{Integer}	y			文本的y位置。
// @param	{String}	text		要显示的文本。
// @param	{String}	align		文本的对齐方式。 [左，中，右]（可选）
function putText(context, x, y, size, text, align) {
	if (typeof align == 'undefined') {
		align = 'right';
	}
	context.font = 'bold ' + size + 'px Arial';
	context.textAlign = align;
	context.fillText(text, x, y);
}

//返回当前的Unix TImestamp。
//@return  返回自Unix纪元开始以来的秒数（1970年1月1日00:00:00 GMT）。
function timestamp() {
	var dtTi = new Date;
	return dtTi.getTime() / 1000;
}


//检查指定的数组中是否存在指定的值。
//@param	{String}	needle		寻求的值
//@param	{Array}		haystack	要搜索的数组
//@return	{Boolean}如果值包含在数组中，则返回True，否则返回False。
function in_array(needle, haystack) {
	for (p = 0; p < haystack.length; p++) {
		if (needle == haystack[p]) {
			return true;
		}
	}
	return false;
}

//生成一个随机数。
// @param	{String}	from	要返回的最低值
// @param	{Array}		to		要返回的最高值。
// @return	{Boolean}	from和to之间的伪随机值。
function randomFromInterval(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}


function parseTimeFormat(time) {
	var dt = parseInt(time);
	var sec = '00' + dt % 60;
	var min = '00' + (dt - sec) / 60;
	var dispt = min.substr(min.length - 2, 2) + ':' + sec.substr(sec.length - 2, 2);
	return dispt;
}



function startdiagram() {
	// 初始化图表类
	aDiagram[3] = new Diagram('myCanvas3', 'myYAxisCanvas3', t, new Array('#395B73', '#6c8dd9'), '', '#e5e4e4', 0, 40, 5, 2, 1);
	aDiagram[1] = new Diagram('myCanvas1', 'myYAxisCanvas1', t, new Array('#395B73', '#f7a600'), '', '#d5d5d5', 70, 100, 5, 2, 2);
	aDiagram[2] = new Diagram('myCanvas2', 'myYAxisCanvas2', t, new Array('#395B73', 'green'), '', '#e5e4e4', 40, 150, 10, 2, 1);
	aDiagram[4] = new Diagram('myCanvas4', 'myYAxisCanvas4', t, new Array('#395B73', 'green'), '', '#d5d5d5', 0, 60, 10, 2, 1);

	drawXValues(aDiagram[1]);

	for (i = 1; i <= 4; i++) {
		aDiagram[i].drawGrid();
		aDiagram[i].drawYValues();
	}
}



//准备数据 for draw (new data)
//对应相关的业务数据；
function prepareNutzdatenArray(input) {
	var datenArray = new Array();
	
	datenArray[1] = input.spo2/10;
	datenArray[2] = input.pulsfrequenz;
	datenArray[3] = input.ist_konzentration/10;
	datenArray[4] = input.volumenstrom;
	datenArray[5] = input.therapeutischer_spo2_wert;
	datenArray[6] = -1;
	datenArray[7] = input.soll_konzentration;
	datenArray[8] = -1;
	
	return datenArray;
}
function runTest(datenArray, tt) {	
    t = tt;
	var breakingPoint = false;
	var lastt = null;
	if (aDiagram[1].mIndex >= 0) {
		lastt = aDiagram[1].messwerte[aDiagram[1].mIndex].t;
	}
	if (t > aDiagram[1].tEnd) {
		breakingPoint = true;
	}
	if (lastt != null)
	{
		drawXValues(aDiagram[1], lastt, t);
	}
	for (var i = 1; i <= 4; i++) {
		aDiagram[i].t = t;	
		aNVal = new Array(datenArray[i], datenArray[i+4]);
		nextWert = new Messwert(aDiagram[i].t, aNVal); // t, wert	
		aDiagram[i].messwerte.push(nextWert);
		aDiagram[i].mIndex++;
		aDiagram[i].drawGraph();
		if (breakingPoint) {
			aDiagram[i].tStart += aDiagram[i].deltaT;
			aDiagram[i].tEnd += aDiagram[i].deltaT;
			aDiagram[i].drawGraph();
		}
		aDiagram[i].reOrg();
			
	}
	if (breakingPoint && lastt != null)
	{
		drawXValues(aDiagram[1], lastt, t);
	}
	indextotal += 1;
}

//在切换之前保存当前值，否则在再次绘制时再次添加时间。
function toggle() {
	var tHypotoxicOld = tHypotoxic;
	if (status == 1) {
		var deltaT = 600;  //显示600秒
		var deltaTLine = 10;  //
		var cntThickLineX = 6;
		status = 2;
	} else {
		var deltaT = 60;
		var deltaTLine = 1;
		var cntThickLineX = 5;
		status = 1;
	}
	for (var i = 1; i <= 4; i++) {
		aDiagram[i].reSize(deltaT, deltaTLine, cntThickLineX);
	}

	drawXValues(aDiagram[1]);

	//重新分配旧值以切换，否则再次绘制时将再次添加时间。
	tHypotoxic = tHypotoxicOld;

}

//向后台获取数据
function getData(){
	var j=335264;
	var tt = 1;
	var interval = setInterval(function(){
	    j++;
		tt++;
		if(t>65535)t=1;
		$.ajax({
				url: "http://localhost:8080/getData",
				data:{id:j},
				type: "POST",
				success: function(result){
					if (result.code == 0) {
						runTest(prepareNutzdatenArray(result.dto),tt);
						$("#param1").html(Math.floor(result.dto.ist_konzentration/10));
						$("#param2").html(Math.floor(result.dto.spo2/10));
						$("#param3").html(Math.floor(result.dto.pulsfrequenz));
						$("#param4").html(Math.floor(result.dto.volumenstrom));
						if(result.dto.endStatus === 1){
                              clearInterval(interval);
							  alert("结束了！");
                           }
					} else {
						alert("请求失败");
					}
				},
				error: function(){
					alert("出错了！");
				}
			});
	},1000);
}
