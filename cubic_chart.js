function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
    var l1 = (p2x - p1x) / 2,
            l2 = (p3x - p2x) / 2,
            a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
            b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
    a = p1y < p2y ? Math.PI - a : a;
    b = p3y < p2y ? Math.PI - b : b;
    var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
            dx1 = l1 * Math.sin(alpha + a),
            dy1 = l1 * Math.cos(alpha + a),
            dx2 = l2 * Math.sin(alpha + b),
            dy2 = l2 * Math.cos(alpha + b);
    return {
        x1: p2x - dx1,
        y1: p2y + dy1,
        x2: p2x + dx2,
        y2: p2y + dy2
    };
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(window).resize(function () {
    tableToChart();
});
$(document).ready(function () {
    tableToChart();
});
function tableToChart() {
    $(".table_to_chart").each(function (nIdx) {

        //윈도우 리사이즈시에 기존에 남아있던 차트는 삭제하고 새로운 차트 생성
        $("td:not(.tlabel)", this).width(0);
        $("#chart_line_" + nIdx).remove();
        /////////////////////////////////////
        /*테이블 구조 (data-json_chart_option 부가(json형식))
            클래스 thead : 2번째 열(th)부터 기간 표시(ex:1일, 2일, 3일...)
            클래스 tdata : 각 행마다 데이터 라인(data-json_line_option 부가(json형식))
                클래스 tlabel 열(td): 데이터 라벨
                나머지 열(td) : 각 데이터
        */
        /////////////////////////////////////
        var json_chart_option = $.parseJSON(($(this).data("json_chart_option") || "{}").replace(/'/g, "\""));

        var nChartHeight = json_chart_option.nChartHeight || 300;
        var sXAxisLabelFont = json_chart_option.sXAxisLabelFont;
        var sYAxisLeftFont = json_chart_option.sYAxisLeftFont;
        var sYAxisRightFont = json_chart_option.sYAxisRightFont;
        var sPopTextColor = json_chart_option.sPopTextColor;
        var sColorArea = json_chart_option.sColorArea;
        var sTableBorderColor = json_chart_option.sTableBorderColor || '#000000';
        $("td", this).css({ "border": "1px solid " + sTableBorderColor });
        var bTableHide = json_chart_option.bTableHide || false;

        var nLabelLegendWidth = 24;
        var nLabelWidth = 0;

        var useYAxisRight = false;

        function colorHighlight(color) {
            var rgb = [];

            var result = "#";
            for (var i = 0; i < 3; i++) {
                rgb[i] = "0x" + color.substring(2 * i + 1, 2 * i + 3);
                rgb[i] = Math.round((rgb[i].toString(10) * 3 + 255) / 4).toString(16);

                result += rgb[i];
            }
            return result;
        };

        $(".tdata", this).each(function () {
            //Y축 오른쪽 라벨을 사용하는지 여부 검사
            var json_line_option = $.parseJSON(($(this).data("json_line_option") || "{}").replace(/'/g, "\""));
            if ((json_line_option.sUseYAxis || "LEFT").toUpperCase() == "RIGHT" && (json_line_option.sChartType || "LINE").toUpperCase() != "PIE")
                useYAxisRight = true;

            //테이블 라벨 최대 너비 구하기
            var data_label = $(".tlabel", this);
            data_label.find("span").remove();
            if (json_line_option.sChartUnit.length > 0) {
                data_label.append("<span>(" + json_line_option.sChartUnit + ")</span>");
            }
            var temp_label_html = data_label.html();
            var label_html = "<span class=\"get_width\">" + temp_label_html + "</span>";
            data_label.html(label_html);
            this.nLabelWidth = data_label.find(".get_width").width() + nLabelLegendWidth
            + parseFloat(data_label.css("border-left"))
            + parseFloat(data_label.css("border-right"))
            + parseFloat(data_label.css("padding-left"))
            + parseFloat(data_label.css("padding-right"));

            if (nLabelWidth < this.nLabelWidth)
                nLabelWidth = this.nLabelWidth;
            data_label.html(temp_label_html);
        });

        var nRightGap = useYAxisRight ? 50 : 0;
        //테이블 너비 설정(오른쪽 Y축 사용 여부에 따라 변경)
        var nTableWidth = $(this).parent().width() - nRightGap;
        $(this).width(nTableWidth);
        $(this).css({
            "table-layout": "fixed"
            , "margin-right": nRightGap + "px"
        });
        var nChartWidth = nTableWidth + nRightGap;
        var chart_div = $("<div id=\"chart_line_" + nIdx + "\" style=\"width:" + nChartWidth + "px;\"></div>").insertBefore(this);
        var nSec = 3000; //애니메이션 시간

        chart_div.setChartObjectHeight(nChartHeight);
        chart_div.setChartObjectWidth(nChartWidth);
        //chart_div.setChartObjectBorder("solid 2px #555555");

        //CHART PAPER를 생성
        var paperChart = chart_div.setChart();

        //Y축 라벨(왼쪽, 오른쪽)
        var sYAxisLeftLabelUnit;
        var sYAxisRightLabelUnit;

        //테이블 헤더 가져오기
        var arrayChartHead = [];
        $(".thead th", this).each(function (nIdx2) {
            if (nIdx2 == 0) return true;
            arrayChartHead.push($(this).text());
        });
        $(".thead", this).hide();

        $(".tdata", this).each(function (nIdx2) {
            var json_line_option = $.parseJSON(($(this).data("json_line_option") || "{}").replace(/'/g, "\""));

            //차트 그래프 타입 설정
            var sChartType = (json_line_option.sChartType || "LINE").toUpperCase();
            var sUseYAxis = (json_line_option.sUseYAxis || "LEFT").toUpperCase();
            var sChartUnit = json_line_option.sChartUnit || "";
            var sChartColor = json_line_option.sChartColor || "#000000";
            var bViewZero = json_line_option.bViewZero || false;
            var sPopTextFont = json_line_option.sPopTextFont;

            //테이블 데이터 가져오기
            var arrayChartData = [];
            var arrayEtcData = [];

            var nDataCount = $("td:not(.tlabel)", this).length;
            $("td:not(.tlabel)", this).each(function (nIdx3) {
                //각 열 너비 설정
                $(this).css({
                    "width": (nTableWidth - nLabelWidth - nDataCount * 3) / nDataCount + "px"
                    , "overflow": "hidden"
                    , "white-space": "nowrap"
                    , "text-overflow": "ellipsis"
                });
                
                //리로딩시 "-"였던 문자열 숫자(0)로 변환
                if ($(this).text() == "-")
                    $(this).text(0);
                //리로딩시 단위가 붙어 있으면 단위 제거
                $(this).find("span").remove();                

                //데이터 배열에 삽입
                arrayChartData.push(Number($(this).text()));

                //데이터 사용 후 원상복구                    
                if ($(this).text() == 0)
                    $(this).text("-");
                else
                    $(this).append("<span>" + sChartUnit + "</span>");

                var jsonEtcData = $.parseJSON(($(this).data("etc") || "{}").replace(/'/g, "\""));
                jsonEtcData["fnClick"] = $(this).attr("onclick").replace("this", "$(\".tdata:eq(" + nIdx2 + ") td:not(.tlabel):eq(" + nIdx3 + ")\")");
                arrayEtcData.push(jsonEtcData);
            });

            var data_label = $(".tlabel", this);
            //라인
            if (sChartType == "LINE") {
                //paperChart.addLineData(라벨, 차트데이터, 라인색깔, 라인두께, 기타데이터)
                var lineLayer = paperChart.addLineData(data_label.text(), arrayChartData, sChartColor, 2, arrayEtcData);

                lineLayer.setViewZero(bViewZero);
                lineLayer.setPopTextFont(sPopTextFont);
                if (sUseYAxis == "RIGHT")
                    lineLayer.useRightYAxis();

                data_label.prepend($("<span id=\"legend" + nIdx + nIdx2 + "\"></span>"));
                var legend = Raphael("legend" + nIdx + nIdx2, 24, 12);
                legend.rect(0, 5, 24, 2).attr({ fill: sChartColor, "stroke-width": 0 })
                legend.circle(12, 6, 3).attr({ fill: sChartColor, "fill-opacity": 1, stroke: sChartColor, "stroke-width": 4, "stroke-opacity": .5 });
            }
                //막대 바
            else if (sChartType == "SIDEBAR") {
                //addSideBarData(라벨, 차트데이터, 바색깔, 하이라이트색깔, 기타데이터)
                var barLayer = paperChart.addSideBarData(data_label.text(), arrayChartData, sChartColor, colorHighlight(sChartColor), arrayEtcData);

                barLayer.setPopTextFont(sPopTextFont);
                //barLayer.colorStroke = "#BFBFBF";
                barLayer.viewPopText = 1;
                if (sUseYAxis == "RIGHT")
                    barLayer.useRightYAxis();

                data_label.prepend($("<span id=\"legend" + nIdx + nIdx2 + "\"></span>"));
                Raphael("legend" + nIdx + nIdx2, 24, 12).rect(0, 0, 24, 12).attr({ fill: sChartColor });
            }
                //스택 바
            else if (sChartType == "STACKBAR") {
                //addStackBarData(라벨, 차트데이터, 바색깔, 하이라이트색깔, 기타데이터)
                var stackLayer = paperChart.addStackBarData(data_label.text(), arrayChartData, sChartColor, colorHighlight(sChartColor), arrayEtcData);

                stackLayer.setPopTextFont(sPopTextFont);
                //stackLayer.colorStroke = "#BFBFBF";
                stackLayer.viewPopText = 1;
                if (sUseYAxis == "RIGHT")
                    stackLayer.useRightYAxis();

                data_label.prepend($("<span id=\"legend" + nIdx + nIdx2 + "\"></span>"));
                Raphael("legend" + nIdx + nIdx2, 24, 12).rect(0, 0, 24, 12).attr({ fill: sChartColor });
            }
                //원형
            else if (sChartType == "PIE") {
                //addPieData(라벨, 차트데이터, 헤더, 색깔배열, 기타데이터)
                var layerPie = paperChart.addPieData(data_label.text(), arrayChartData, arrayChartHead, null, arrayEtcData);

                layerPie.setTitlePosition(0);
                layerPie.setTitleColor(sChartColor);
                layerPie.setTitleFont("bold 14pt 맑은 고딕");
                layerPie.setRadius(chart_height / 3);
                layerPie.setStrokeWidth(1);
                layerPie.colorStroke = "#FFFFFF";
                layerPie.labelText = sChartUnit;
                layerPie.setLabelFont("bold 10pt 맑은 고딕");

                data_label.prepend($("<span id=\"legend" + nIdx + nIdx2 + "\"></span>"));
                Raphael("legend" + nIdx + nIdx2, 24, 12).circle(12, 6, 6).attr({ fill: sChartColor, "stroke-width": 0 });
            }
            //간트 바(미완성)
            /*
            else if (sChartType == "GANTTBAR") {
                var ganttLayer = paperChart.addGanttBarData(data_label.text(), arrayChartData, 0, 30, 1, sChartColor)
            }
            */
            if (sUseYAxis == "RIGHT")
                sYAxisRightLabelUnit = sChartUnit;
            else
                sYAxisLeftLabelUnit = sChartUnit;
        });

        //CHART AREA의 MARGIN을 SET
        //각각 최소값은 setChartAreaMargin 에서 확인
        var nLeft = parseFloat($(".tlabel:first", this).width())
            + parseFloat($(".tlabel:first", this).css("border-left"))
            + parseFloat($(".tlabel:first", this).css("border-right"))
            + parseFloat($(".tlabel:first", this).css("padding-left"))
            + parseFloat($(".tlabel:first", this).css("padding-right"))
            , nTop = 40
            , nBottom = 25
            , nRight = nRightGap
            + parseFloat($(".tlabel:first", this).css("border-right"));
        if (bTableHide) {
            $(this).hide();
            nLeft = 50;
        }
        paperChart.setChartAreaMargin(nLeft, nTop, nBottom, nRight);



        //CHART AREA를 정의(Y축라인 갯수, 라인색상, 구분배경색)
        //Y축라인 갯수를 정하지 않으면 MaxY/100 으로 자동 셋팅됨
        var nY = 10;
        var sColorLine = sTableBorderColor;

        paperChart.setChartArea(nY, sColorLine, sColorArea);
        paperChart.sDefaultTxtColor = sTableBorderColor;

        //X축 라벨을 셋팅
        paperChart.sXAxisTickWidth = 1;

        paperChart.sXAxisLabel = arrayChartHead;
        paperChart.sXAxisLabelFont = sXAxisLabelFont;

        paperChart.nXAxisBorderWidth = 1;
        paperChart.sXAxisBorderColor = sTableBorderColor;

        paperChart.nYAxisRightBorderWidth = 1;
        paperChart.nYAxisRightBorderColor = sTableBorderColor;

        //XAxisTick (+면 위쪽으로, -면 아래쪽으로 생성됨)
        paperChart.nXAxisTick = -25;
        //paperChart.nXAxisTickStep = 5;
        //paperChart.nXAxisTickLocation = .5;

        //Y축 라벨 셋팅
        paperChart.sYAxisLeftFont = sYAxisLeftFont;
        paperChart.sYAxisRightFont = sYAxisRightFont;

        //Y축 라벨 값 뒤에 붙을 TEXT을 셋팅
        paperChart.sYAxisLeftLabelUnit = sYAxisLeftLabelUnit;
        paperChart.sYAxisRightLabelUnit = sYAxisRightLabelUnit;

        //Y축 라벨 Max값을 셋팅, 셋팅하지 않으면 최대값 * 1.2 로 자동 셋팅
        //paperChart.setYAxisMax(100);
        //paperChart.setYAxisDecimal(2);

        //BarGap을 셋팅, 셋팅하지 않으면 BAR 넓이 만큼으로 자동 셋팅
        //paperChart.setBarGap(0.2);

        paperChart.sPopTextColor = sPopTextColor;

        //LEGEND를 표시하려면 setLegend([배경색상])
        paperChart.sLegendDisplay = 0;
        paperChart.nLegendVertical = 1;

        paperChart.nLegendLocationY = paperChart.setTop();
        paperChart.nLegendLocationX = paperChart.setCenter();

        paperChart.nLegendMarginY = 10;
        paperChart.nLegendMarginX = 10;

        paperChart.nLegendKeySize = 20;
        paperChart.nLegendTextSize = 50;
        paperChart.nLegendTextPadding = 5;
        paperChart.nLegendTextMarginLeft = 10;
        paperChart.nLegendTextMarginRight = 10;
        //paperChart.sLegendColorBg = "#EAEAEA";
        paperChart.sLegendColorBorder = "#FFFFFF";
        paperChart.nLegendRadiusBorder = 3;

        //CHART Animation 시간
        paperChart.nDrawSec = nSec;

        //그리자....
        paperChart.drawChart();
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////
//SIDE BAR Class
function classSideBAR(name, data, color, colorHL, etc_data) {
    this.name = name;
    this.data = data;
    this.color = color || "#4F81BD";
    this.colorHL = colorHL;
    this.etc_data = etc_data;
    this.upperTextSideBar = [];
    this.baseYAxis = 1;

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name || "N/A";
        return name;
    };

    this.getData = function() {
        return this.data;
    };

    this.setData = function(data) {
        this.data = data;
        return data;
    };

    this.getColor = function() {
        return this.color;
    };

    this.setColor = function(color) {
        this.color = color;
        return color;
    };

    this.getColorHL = function() {
        return this.colorHL;
    };

    this.setColorHL = function(colorHL) {
        this.colorHL = colorHL;
        return colorHL;
    };

    this.getWidth = function() {
        return this.width;
    };

    this.setWidth = function(width) {
        this.width = width;
        return width;
    };

    this.getLabelText = function() {
        return this.labelText;
    };

    this.getStrokeWidth = function() {
        return this.strokeWidth;
    };

    this.setStrokeWidth = function(strokeWidth) {
        this.strokeWidth = strokeWidth;
        return strokeWidth;
    };

    this.getStrokeColor = function() {
        return this.colorStroke;
    };


    this.getPopColorText = function() {
        return this.colorPopText;
    };

    this.setPopColorText = function(colorPopText) {
        this.colorPopText = colorPopText;
        return colorPopText;
    };

    this.getPopTextFont = function() {
        return this.fontPopText;
    };

    this.setPopTextFont = function(fontPopText) {
        this.fontPopText = fontPopText;
        return fontPopText;
    };

    this.getPopColorFill = function() {
        return this.colorPopFill;
    };

    this.setPopColorFill = function(colorPopFill) {
        this.colorPopFill = colorPopFill;
        return colorPopFill;
    };

    this.getPopColorStroke = function() {
        return this.colorPopStroke;
    };

    this.setPopColorStroke = function(colorPopStroke) {
        this.colorPopStroke = colorPopStroke;
        return colorPopStroke;
    };

    this.getPopWidthStroke = function() {
        return this.widthPopStroke;
    };

    this.setPopWidthStroke = function(colorPopStroke) {
        this.widthPopStroke = widthPopStroke;
    };

    this.getMaxY = function() {
        return Math.max.apply(Math, this.data) || 0;
    };

    this.getMinY = function() {
        return Math.min.apply(Math, this.data) || 0;
    };

    this.useRightYAxis = function() {
        this.baseYAxis = 2;
    };

    this.setUpperText = function(sFont, sColor) {
        this.viewUpperText = 1;
        this.upperTextFont = sFont;
        this.upperTextColor = sColor;
    };

    this.setUpperTextPosion = function(nUpperTextPosion) {
        this.nUpperTextPosion = nUpperTextPosion || 1;
    };


};
//SIDE BAR Class
/////////////////////////////////////////////


/////////////////////////////////////////////
//STACK BAR Class
function classStackBAR(name, data, color, colorHL, etc_data) {
    this.name = name;
    this.data = data;
    this.color = color || "#4F81BD";
    this.colorHL = colorHL;
    this.etc_data = etc_data;
    this.baseYAxis = 1;

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name;
        return name;
    };

    this.getData = function() {
        return this.data;
    };

    this.setData = function(data) {
        this.data = data;
        return data;
    };

    this.getColor = function() {
        return this.color;
    };

    this.setColor = function(color) {
        this.color = color;
        return color;
    };

    this.getColorHL = function() {
        return this.colorHL;
    };

    this.setColorHL = function(colorHL) {
        this.colorHL = colorHL;
        return colorHL;
    };

    this.getWidth = function() {
        return this.width;
    };

    this.setWidth = function(width) {
        this.width = width;
        return width;
    };

    this.getLabelText = function() {
        return this.labelText;
    };

    this.getStrokeWidth = function() {
        return this.strokeWidth;
    };

    this.setStrokeWidth = function(strokeWidth) {
        this.strokeWidth = strokeWidth;
        return strokeWidth;
    };

    this.getStrokeColor = function() {
        return this.colorStroke;
    };


    this.getPopColorText = function() {
        return this.colorPopText;
    };

    this.setPopColorText = function(colorPopText) {
        this.colorPopText = colorPopText;
        return colorPopText;
    };

    this.getPopTextFont = function() {
        return this.fontPopText;
    };

    this.setPopTextFont = function(fontPopText) {
        this.fontPopText = fontPopText;
        return fontPopText;
    };

    this.getPopColorFill = function() {
        return this.colorPopFill;
    };

    this.setPopColorFill = function(colorPopFill) {
        this.colorPopFill = colorPopFill;
        return colorPopFill;
    };

    this.getPopColorStroke = function() {
        return this.colorPopStroke;
    };

    this.setPopColorStroke = function(colorPopStroke) {
        this.colorPopStroke = colorPopStroke;
        return colorPopStroke;
    };

    this.getPopWidthStroke = function() {
        return this.widthPopStroke;
    };

    this.setPopWidthStroke = function(colorPopStroke) {
        this.widthPopStroke = widthPopStroke;
        return widthPopStroke;
    };

    this.useRightYAxis = function() {
        this.baseYAxis = 2;
    };
};
//STACK BAR Class
/////////////////////////////////////////////



/////////////////////////////////////////////
//LINE Class
function classLine(name, data, color, thickness, etc_data) {
    this.name = name;
    this.data = data;
    this.color = color || "#4F81BD";
    this.thickness = thickness || 2;
    this.etc_data = etc_data;
    this.baseYAxis = 1;

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name;
        return name;
    };

    this.getData = function() {
        return this.data;
    };

    this.setData = function(data) {
        this.data = data;
        return data;
    };

    this.getViewZero = function() {
        return this.hideZero;
    };

    this.setViewZero = function (viewZero) {
        this.viewZero = viewZero;
        return viewZero;
    };

    this.getColor = function() {
        return this.color;
    };

    this.setColor = function(color) {
        this.color = color;
        return color;
    };

    this.getThickness = function() {
        return this.thickness;
    };

    this.setThickness = function(thickness) {
        this.thickness = thickness;
        return thickness;
    };

    this.getLabelText = function() {
        return this.labelText;
    };

    this.getDotSize = function() {
        return this.sizeDot;
    };

    this.setDotSize = function(sizeDot) {
        this.sizeDot = sizeDot;
        return this.sizeDot;
    };

    this.getStrokeWidth = function() {
        return this.widthStroke;
    };

    this.setStrokeWidth = function(widthStroke) {
        this.widthStroke = widthStroke;
        return this.widthStroke;
    };

    this.getHLSize = function() {
        return this.sizeHL;
    };

    this.setHLSize = function(sizeHL) {
        this.sizeHL = sizeHL;
        return sizeHL;
    };

    this.getPopColorText = function() {
        return this.colorPopText;
    };

    this.setPopColorText = function(colorPopText) {
        this.colorPopText = colorPopText;
        return colorPopText;
    };

    this.getPopTextFont = function() {
        return this.fontPopText;
    };

    this.setPopTextFont = function(fontPopText) {
        this.fontPopText = fontPopText;
        return fontPopText;
    };

    this.getPopColorFill = function() {
        return this.colorPopFill;
    };

    this.setPopColorFill = function(colorPopFill) {
        this.colorPopFill = colorPopFill;
        return colorPopFill;
    };

    this.getPopColorStroke = function() {
        return this.colorPopStroke;
    };

    this.setPopColorStroke = function(colorPopStroke) {
        this.colorPopStroke = colorPopStroke;
        return colorPopStroke;
    };

    this.getPopWidthStroke = function() {
        return this.widthPopStroke;
    };

    this.setPopWidthStroke = function(colorPopStroke) {
        this.widthPopStroke = widthPopStroke;
        return widthPopStroke;
    };

    this.getMaxY = function() {
        return Math.max.apply(Math, this.data); ;
    };

    this.getMinY = function() {
        return Math.min.apply(Math, this.data) || 0;
    };

    this.useRightYAxis = function() {
        this.baseYAxis = 2;
    };
};
//LINE Class
/////////////////////////////////////////////


/////////////////////////////////////////////
//PIE Class
function classPIE(name, data, labels, colors, etc_data) {
    this.name = name;
    this.data = data;
    this.labels = labels;
    this.colors = colors || ["#268F81", "#804CD9", "#FF8E46", "#FFEA00", "#FF7E00", "#33BAFF", "#8BBA00", "#F6BD0F", "#FF2DA4", "#FFC519", "#90D133", "#D64646", "#8E468E", "#588526", "#B3AA00", "#008ED6", "#9D080D", "#A186BE", "#DC4522", "#AFD8F8", "#F6BD0F", "#8BBA00", "#FF8E46", "#D64646", "#8E468E", "#588526", "#B3AA00", "#008ED6", "#9D080D", "#A186BE", "#DC4522", "#FF7E00", "#FFC519", "#90D133", "#FFEA00", "#268F81", "#33BAFF", "#804CD9", "#FF2DA4"];
    this.etc_data = etc_data;

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name;
        return name;
    };

    this.getData = function() {
        return this.data;
    };

    this.setData = function(data) {
        this.data = data;
        return data;
    };

    this.getColors = function() {
        return this.colors;
    };

    this.setColors = function(colors) {
        this.colors = colors;
        return colors;
    };

    this.getRadius = function() {
        return this.radius;
    };

    this.setRadius = function(radius) {
        this.radius = radius;
        return radius;
    };

    this.moveCenter = function(moveX, moveY) {
        this.moveX = moveX;
        this.moveY = moveY;
        return;
    };

    this.setPercent = function(nYAxisDecimal) {
        this.percent = 1;
        this.percentDecimal = (nYAxisDecimal || 1);
        return;
    };

    this.getLabelText = function() {
        return this.labelText;
    };

    this.getStrokeWidth = function() {
        return this.strokeWidth;
    };

    this.setStrokeWidth = function(strokeWidth) {
        this.strokeWidth = strokeWidth;
        return strokeWidth;
    };

    this.getStrokeColor = function() {
        return this.colorStroke;
    };

    this.setTitlePosition = function(nTitlePosition) {
        this.nTitlePosition = nTitlePosition;
        return nTitlePosition;
    };

    this.setTitleColor = function(colorTitle) {
        this.colorTitle = colorTitle;
        return colorTitle;
    };

    this.setTitleFont = function(fontTitle) {
        this.fontTitle = fontTitle;
        return fontTitle;
    };

    this.setViewLabel = function() {
        this.viewLabel = 1;
        return 1;
    };

    this.setLabelPosition = function(labelPosition) {
        this.labelPosition = labelPosition;
        return labelPosition;
    };

    this.setLabelColor = function(labelColor) {
        this.labelColor = labelColor;
        return labelColor;
    };

    this.setLabelFont = function(labelFont) {
        this.labelFont = labelFont;
        return labelFont;
    };
};
//PIE Class
/////////////////////////////////////////////


/////////////////////////////////////////////
//GANTT Class
function classGanttBar(name, data, dt_Gantt_Start, dt_Gantt_End, s_Gantt_Term, s_Gantt_Color_Border) {
    this.name = name;
    this.data = data;
    this.dt_Gantt_Start = dt_Gantt_Start;
    this.dt_Gantt_End = dt_Gantt_End;
    this.s_Gantt_Term = s_Gantt_Term;
    this.s_Gantt_Color_Border = s_Gantt_Color_Border;
};
//GANTT Class
/////////////////////////////////////////////


/////////////////////////////////////////////
//Legend Class
function classLegend() {
    this.jsonLegendKey = [];
};
//Legend Class
/////////////////////////////////////////////

/////////////////////////////////////////////
//JQuery Object Extend
$.fn.extend({
    setChart: function() {
        var objChart = Raphael($(this).attr("id"));
        //alert($(this).width());
        objChart.width = $(this).width();
        objChart.height = $(this).height();

        objChart.dataSideBar = [];
        objChart.dataStackBar = [];
        objChart.dataGanttBar = [];
        objChart.dataLine = [];
        objChart.dataPie = [];

        objChart.legend = [];
        objChart.nPaddingLeft = 5;
        objChart.nPaddingTop = 5;
        objChart.nPaddingBottom = 5;
        objChart.nPaddingRight = 5;

        objChart.maxY_Left = 0;
        objChart.maxY_Right = 0;
        objChart.nDrawSec = 0; //기본 그리는 시간

        objChart.nY = 5;

        objChart.sDefaultTxtFont = "bold 9pt 맑은 고딕";
        objChart.sDefaultTxtColor = "#000000";

        return objChart;
    }
});

$.fn.extend({
    setChartObjectWidth: function(nWidth) {
        $(this).width(nWidth);
        return;
    }
});


$.fn.extend({
    setChartObjectHeight: function(nHeight) {
        $(this).height(nHeight);
        return;
    }
});


$.fn.extend({
    setChartObjectBorder: function(sBorder) {
        $(this).css("border", sBorder);
        return;
    }
});


$.fn.extend({
    setChartObjectBgColor: function(sBgColor) {
        $(this).css("background-color", sBgColor);
        return;
    }
});
//CAHRT Class(JQuery Object)
/////////////////////////////////////////////


/////////////////////////////////////////////
//Raphael Extend
Raphael.fn.setChartAreaMargin = function(nLeft, nTop, nBottom, nRight) {

    (nLeft < 5) ? nLeft = 5 : nLeft = nLeft;
    (nTop < 5) ? nTop = 5 : nTop = nTop;
    //(nRight < 5) ? nRight = 5 : nRight = nRight;
    (nBottom < 5) ? nBottom = 5 : nBottom = nBottom;
    nRight = nRight;

    this.nPaddingLeft = nLeft;
    this.nPaddingTop = nTop;
    this.nPaddingBottom = nBottom;
    this.nPaddingRight = nRight;

    this.nPosLeft = nLeft;
    this.nPosRight = this.width - nRight;
    this.nPosTop = nTop;
    this.nPosBottom = this.height - nBottom;

    this.txtFront = this.set();

    return;
};

Raphael.fn.refreshChartAreaMargin = function() {
    //if (this.sXAxisLabel || 0 > 0) {
    if (this.sXAxisLabel) {
        if ((this.nReverseXY || 0) == 1) {
            this.nPixelLabelX = (this.width - this.nPaddingLeft - this.nPaddingRight) / (this.sXAxisLabel.length - 1);
        } else {
            this.nPixelLabelX = (this.width - this.nPaddingLeft - this.nPaddingRight) / this.sXAxisLabel.length;
        };
    };
};

Raphael.fn.setProperties = function(jsonData) {
    for (var sKey in jsonData) {
        if (isNaN(jsonData[sKey])) {
            var sValue = "'" + jsonData[sKey] + "'";
        } else {
            var sValue = jsonData[sKey];
        };
        eval("this." + sKey + "=" + sValue + ";");
    };
};

Raphael.fn.setChartArea = function(nY, sColorLine, sColorArea) {
    this.nY = nY;
    this.sColorLine = sColorLine;
    this.sColorArea = sColorArea;
    return;
};

Raphael.fn.getXLabelFont = function() {
    return this.sXAxisLabelFont || this.sDefaultTxtFont;
};


Raphael.fn.getXLabelColor = function() {
    return this.sXAxisLabelColor || sDefaultTxtColor;
};


Raphael.fn.setRightYAxisLocation = function(nRightYAxisLocation) {
    if (isNaN(nRightYAxisLocation)) nRightYAxisLocation = 0;
    this.nRightYAxisLocation = nRightYAxisLocation || 0;
    return;
};

Raphael.fn.setRightYAxisFont = function(sYAxisRightFont) {
    this.sYAxisRightFont = sYAxisRightFont;
    return;
};

Raphael.fn.setRightYAxisColor = function(sYAxisRightColor) {
    this.sYAxisRightColor = sYAxisRightColor;
    return;
};

Raphael.fn.setYAxisMax = function (nYAxisMax) {
    this.nYAxisMax = nYAxisMax;
    return;
};

Raphael.fn.setYAxisLeftTitle = function(sLeftTitleY, sLeftTitleFontY, sLeftTitleColorY) {
    this.sLeftTitleY = sLeftTitleY;
    this.sLeftTitleFontY = sLeftTitleFontY;
    this.sLeftTitleColorY = sLeftTitleColorY;
    return;
};

Raphael.fn.setRightYAxisTitle = function(sRightTitleY, sRightTitleFontY, sRightTitleColorY) {
    this.sRightTitleY = sRightTitleY;
    this.sRightTitleFontY = sRightTitleFontY;
    this.sRightTitleColorY = sRightTitleColorY;
    return;
};


Raphael.fn.setLeftYAxisLabel = function(sY) {
    this.sYAxisLeftLabelUnit = sY;
    return;
};


Raphael.fn.setRightYAxisLabel = function(sY) {
    this.sYAxisRightLabelUnit = sY;
    return;
};

Raphael.fn.addSideBarData = function (sDataName, arrData, sColor, sColorHL, etcData) {
    var tempObj = new classSideBAR(sDataName, arrData, sColor, sColorHL, etcData);
    this.dataSideBar.push(tempObj);

    return tempObj;
};


Raphael.fn.addStackBarData = function (sDataName, arrData, sColor, sColorHL, etcData) {
    var tempObj = new classStackBAR(sDataName, arrData, sColor, sColorHL, etcData);
    this.dataStackBar.push(tempObj);

    return tempObj;
};

Raphael.fn.addGanttBarData = function(sDataName, arrData, dt_Gantt_Start, dt_Gantt_End, s_Gantt_Term, s_Gantt_Color_Border) {
    var tempObj = new classGanttBar(sDataName, arrData, dt_Gantt_Start, dt_Gantt_End, s_Gantt_Term, s_Gantt_Color_Border);
    this.dataGanttBar.push(tempObj);

    return tempObj;
};


Raphael.fn.addLineData = function(sDataName, arrData, sColor, nThickness, etcData) {
    var tempObj = new classLine(sDataName, arrData, sColor, nThickness, etcData);
    this.dataLine.push(tempObj);

    return tempObj;
};


Raphael.fn.addPieData = function (sDataName, arrData, arrLabel, arrColor, etcData) {
    var tempObj = new classPIE(sDataName, arrData, arrLabel, arrColor, etcData);
    this.dataPie.push(tempObj);

    return tempObj;
};


Raphael.fn.addLegend = function() {
    var tempClass = new classLegend();
    this.classLegend = tempClass;
    return tempClass;
};


//////////////////////////////////////////////////////////////
/////LEGEND
Raphael.fn.setLegend = function() {
    this.sLegendDisplay = 1;
    return this.sLegendDisplay;
};
/////LEGEND
//////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////
/////위치 정의
Raphael.fn.setTop = function() {
    return 1;
};

Raphael.fn.setMiddle = function() {
    return 2;
};

Raphael.fn.setBottom = function() {
    return 3;
};

Raphael.fn.setCenter = function() {
    return 1;
};

Raphael.fn.setLeft = function() {
    return 2;
};

Raphael.fn.setRight = function() {
    return 3;
};

/////위치 정의
//////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////
/////도형 형태
Raphael.fn.shapeRect = function() {
    return 1;
};

Raphael.fn.shapeLine = function() {
    return 2;
};

Raphael.fn.shapeDotLine = function() {
    return 3;
};

Raphael.fn.shapeTriangle = function() {
    return 4;
};

Raphael.fn.shapeDiamond = function() {
    return 5;
};

Raphael.fn.shapeStar = function() {
    return 6;
};

/////도형 형태
//////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////
/////MarkArea
Raphael.fn.addMarkAreaYLeft = function(jsonData) {
    if (!this.markAreaYLeft) {
        this.markAreaYLeft = [];
    };

    this.markAreaYLeft.push(jsonData);
};


Raphael.fn.addMarkAreaX = function(jsonData) {
    if (!this.markAreaX) {
        this.markAreaX = [];
    };

    this.markAreaX.push(jsonData);
};
/////MarkArea
//////////////////////////////////////////////////////////////



Raphael.fn.drawChart = function() {
    //alert(this.sBgColor);
    this.refreshChartAreaMargin();

    //MAX Y값을 계산
    var arryMin_Left = [];
    var arryMin_Right = [];

    var arryMax_Left = [];
    var arryMax_Right = [];

    for (var nBar = 0, nMax = this.dataSideBar.length || 0; nBar < nMax; nBar++) {
        if (this.dataSideBar[nBar].baseYAxis == 1) {
            arryMin_Left.push(this.dataSideBar[nBar].getMinY() || 0);
            arryMax_Left.push(this.dataSideBar[nBar].getMaxY() || 0);
        } else {
            arryMin_Right.push(this.dataSideBar[nBar].getMinY() || 0);
            arryMax_Right.push(this.dataSideBar[nBar].getMaxY() || 0);
        }
    };

    for (var nLine = 0, nMax = this.dataLine.length || 0; nLine < nMax; nLine++) {
        if (this.dataLine[nLine].baseYAxis == 1) {
            arryMin_Left.push(this.dataLine[nLine].getMinY() || 0);
            arryMax_Left.push(this.dataLine[nLine].getMaxY() || 0);
        } else {
            arryMin_Right.push(this.dataLine[nLine].getMinY() || 0);
            arryMax_Right.push(this.dataLine[nLine].getMaxY() || 0);
        };
    };

    if (this.sXAxisLabel !== undefined) {
        for (var nIdx = 0, nXL = this.sXAxisLabel.length || 0; nIdx < nXL; nIdx++) {
            var nTemp_Left = 0;
            var nTemp_Right = 0;
            for (var nStack = 0, nMax = this.dataStackBar.length; nStack < nMax; nStack++) {
                if (this.dataStackBar[nStack].baseYAxis == 1) {
                    nTemp_Left += parseFloat(this.dataStackBar[nStack].data[nIdx]) || 0;
                } else {
                    nTemp_Right += parseFloat(this.dataStackBar[nStack].data[nIdx]) || 0;
                };
            };

            arryMax_Left.push(nTemp_Left);
            arryMax_Right.push(nTemp_Right);
        };
    };

    var nMarginMax = this.nMarginMax || 1.2;
    if (Math.max.apply(Math, arryMax_Left) * nMarginMax > this.maxY_Left) { this.maxY_Left = Math.max.apply(Math, arryMax_Left) * nMarginMax };
    if (Math.max.apply(Math, arryMax_Right) * nMarginMax > this.maxY_Right) { this.maxY_Right = Math.max.apply(Math, arryMax_Right) * nMarginMax };

    this.minY_Left = this.minY_Left || 0;
    this.minY_Right = this.minY_Right || 0;

    var nMarginMin = this.nMarginMin || 0.8;

    if ((this.dataStackBar.length || 0) == 0) {
        if (Math.min.apply(Math, arryMin_Left) * nMarginMin < this.minY_Left) { this.minY_Left = Math.min.apply(Math, arryMin_Left) * nMarginMin };
        if (Math.min.apply(Math, arryMin_Right) * nMarginMin < this.minY_Right) { this.minY_Right = Math.min.apply(Math, arryMin_Right) * nMarginMin };
    } else {
        this.minY_Left = 0;
        this.minY_Right = 0;
    };

    if (this.dataGanttBar.length == 0) {
        (this.maxY_Left > 1000) ? this.maxY_Left = (this.maxY_Left / 100).toFixed(0) * 100 : this.maxY_Left = (this.maxY_Left / 10).toFixed(0) * 10;
        (this.maxY_Right > 1000) ? this.maxY_Right = (this.maxY_Right / 100).toFixed(0) * 100 : this.maxY_Right = (this.maxY_Right / 10).toFixed(0) * 10;

        (this.minY_Left < 100) ? this.minY_Left = (this.minY_Left / 10).toFixed(0) * 10 : this.minY_Left = (this.minY_Left / 100).toFixed(0) * 100;
        (this.minY_Right < 100) ? this.minY_Right = (this.minY_Right / 10).toFixed(0) * 10 : this.minY_Right = (this.minY_Right / 100).toFixed(0) * 100;
    } else {
        this.maxY_Left = DateDiff(this.dataGanttBar[0].s_Gantt_Term, this.dataGanttBar[0].dt_Gantt_Start, this.dataGanttBar[0].dt_Gantt_End);
    };

    //Y축 한 단위당 pixel값을 구함
    if ((this.nReverseXY || 0) == 1) {
        (this.maxY_Left > 0) ? this.nPixelUnitY_Left = (this.width - this.nPaddingLeft - this.nPaddingRight) / (this.maxY_Left - this.minY_Left) : this.nPixelUnitY_Left = this.width;
        (this.maxY_Right > 0) ? this.nPixelUnitY_Right = (this.width - this.nPaddingLeft - this.nPaddingRight) / (this.maxY_Right - this.minY_Right) : this.nPixelUnitY_Right = this.width;
    } else {
        (this.maxY_Left > 0) ? this.nPixelUnitY_Left = (this.height - this.nPaddingBottom - this.nPaddingTop) / (this.maxY_Left - this.minY_Left) : this.nPixelUnitY_Left = this.height;
        (this.maxY_Right > 0) ? this.nPixelUnitY_Right = (this.height - this.nPaddingBottom - this.nPaddingTop) / (this.maxY_Right - this.minY_Right) : this.nPixelUnitY_Right = this.height;
    };

    //BACK GRID를 생성
    this.drawGrid();


    this.drawMarkArea();


    //GANTT BAR CHART를 생성
    if (this.dataGanttBar.length) {
        this.drawGanttBarChart();
    };

    //SIDE BAR CHART를 생성
    if (this.dataSideBar.length) {
        if ((this.sLegendDisplay || 0) > 0) {
            if ((this.classLegend || 0) == 0) {
                this.classLegend = this.addLegend();
            };
            this.classLegend.nLegendVertical = this.nLegendVertical || 1;
            this.classLegend.nLegendLocationY = this.nLegendLocationY || 1;
            this.classLegend.nLegendLocationX = this.nLegendLocationX || 1;
            this.classLegend.nLegendMarginX = this.nLegendMarginX || 10;
            this.classLegend.nLegendMarginY = this.nLegendMarginY || 10;
            this.classLegend.sLegendFont = this.sLegendFont || "bold 9pt 맑은 고딕";
            this.classLegend.nLegendKeySize = this.nLegendKeySize || 20;
            this.classLegend.nLegendTextSize = this.nLegendTextSize || 20;
            this.classLegend.nLegendTextPadding = this.nLegendTextPadding || 5;
            this.classLegend.nLegendTextMarginLeft = this.nLegendTextMarginLeft || 10;
            this.classLegend.nLegendTextMarginRight = this.nLegendTextMarginRight || 10;
            this.classLegend.sLegendColorBg = this.sLegendColorBg || this.sColorArea;
            this.classLegend.sLegendColorBorder = this.sLegendColorBorder || "#555555";
            this.classLegend.nLegendRadiusBorder = this.nLegendRadiusBorder || 0;
        };

        for (nBar = 0; nBar < this.dataSideBar.length; nBar++) {
            this.drawSideBarChart(nBar, this.dataSideBar[nBar]);
            if ((this.sLegendDisplay || 0) > 0) {
                this.classLegend.jsonLegendKey.push({ "sType": this.shapeRect(), "sText": this.dataSideBar[nBar].name, "sAreaColor": this.dataSideBar[nBar].color, "sTxtColor": this.sDefaultTxtColor || "#FFFFFF" });
            };
        };
    };

    //STACK CHART를 생성
    if (this.dataStackBar.length > 0) {
        this.drawStackBarChart();
    };

    //LINE CHART를 생성
    if (this.dataLine.length) {
        if ((this.sLegendDisplay || 0) > 0) {
            if ((this.classLegend || 0) == 0) {
                this.classLegend = this.addLegend();
            };
            this.classLegend.nLegendVertical = this.nLegendVertical || 1;
            this.classLegend.nLegendLocationY = this.nLegendLocationY || 1;
            this.classLegend.nLegendLocationX = this.nLegendLocationX || 1;
            this.classLegend.nLegendMarginX = this.nLegendMarginX || 10;
            this.classLegend.nLegendMarginY = this.nLegendMarginY || 10;
            this.classLegend.sLegendFont = this.sLegendFont || "bold 9pt 맑은 고딕";
            this.classLegend.nLegendKeySize = this.nLegendKeySize || 20;
            this.classLegend.nLegendTextSize = this.nLegendTextSize || 20;
            this.classLegend.nLegendTextPadding = this.nLegendTextPadding || 5;
            this.classLegend.nLegendTextMarginLeft = this.nLegendTextMarginLeft || 10;
            this.classLegend.nLegendTextMarginRight = this.nLegendTextMarginRight || 10;
            this.classLegend.sLegendColorBg = this.sLegendColorBg || this.sColorArea;
            this.classLegend.sLegendColorBorder = this.sLegendColorBorder || "#555555";
            this.classLegend.nLegendRadiusBorder = this.nLegendRadiusBorder || 0;
        };
        for (nLine = 0; nLine < this.dataLine.length; nLine++) {
            this.drawLineChart(nLine, this.dataLine[nLine]);
            if ((this.sLegendDisplay || 0) > 0) {
                this.classLegend.jsonLegendKey.push({ "sType": this.shapeDotLine(), "sText": this.dataLine[nLine].name, "sAreaColor": this.dataLine[nLine].color, "sTxtColor": this.sDefaultTxtColor || "#FFFFFF" });
            };
        };
    };

    //PIE CHART를 생성
    if (this.dataPie.length > 0) {
        if ((this.sLegendDisplay || 0) > 0) {
            if ((this.classLegend || 0) == 0) {
                this.classLegend = this.addLegend();
            };
            this.classLegend.nLegendVertical = this.nLegendVertical || 1;
            this.classLegend.nLegendLocationY = this.nLegendLocationY || 1;
            this.classLegend.nLegendLocationX = this.nLegendLocationX || 1;
            this.classLegend.nLegendMarginX = this.nLegendMarginX || 10;
            this.classLegend.nLegendMarginY = this.nLegendMarginY || 10;
            this.classLegend.sLegendFont = this.sLegendFont || "bold 9pt 맑은 고딕";
            this.classLegend.nLegendKeySize = this.nLegendKeySize || 20;
            this.classLegend.nLegendTextSize = this.nLegendTextSize || 20;
            this.classLegend.nLegendTextPadding = this.nLegendTextPadding || 5;
            this.classLegend.nLegendTextMarginLeft = this.nLegendTextMarginLeft || 10;
            this.classLegend.nLegendTextMarginRight = this.nLegendTextMarginRight || 10;
            this.classLegend.sLegendColorBg = this.sLegendColorBg || this.sColorArea;
            this.classLegend.sLegendColorBorder = this.sLegendColorBorder || "#555555";
            this.classLegend.nLegendRadiusBorder = this.nLegendRadiusBorder || 0;
        };

        for (nPie = 0; nPie < this.dataPie.length; nPie++) {
            this.drawPieChart(nPie, this.dataPie[nPie]);
            if ((this.sLegendDisplay || 0) > 0) {
                this.classLegend.jsonLegendKey.push({ "sType": this.shapeRect(), "sText": this.dataPie[nPie].name, "sAreaColor": this.dataPie[nPie].color, "sTxtColor": this.sDefaultTxtColor || "#FFFFFF" });
            };
        };
    };

    if (this.classLegend || 0 > 0) {
        if (this.classLegend.jsonLegendKey[0] || 0 > 0) {
            this.drawLegend();
        };
    };

    var txt = this.text(100, 100, "Powered by Cubictek").hide();
    txt.attr({ x: this.width - txt.getBBox().width / 2 - 9, y: 7, font: "bold 8pt 맑은 고딕", fill: "#CC0000" }).show().toFront();

    txt.hover(function() {
        $("#frmMain").css("cursor", "pointer");
    }, function() {
        $("#frmMain").css("cursor", "default");
    })
    ;

    var txtLicense = this.text(this.width / 2, this.height / 2, "Unlicensed Use!!!").attr({ font: "bold 100pt 맑은 고딕", fill: "#CC0000" }).hide();
    //txtLicense.show().toFront();

    for (var nIdx = 0; nIdx < this.txtFront.length; nIdx++) {
        this.txtFront[nIdx].toFront();
    };

    return true;
};

Raphael.fn.drawMarkArea = function() {
    ///////////////////////////////////////////////////////////////////////
    //markAreaYLeft
    if (this.markAreaYLeft) {

        for (var nIdx = 0; nIdx < this.markAreaYLeft.length; nIdx++) {
            var nMarkAreaYTop = this.markAreaYLeft[nIdx].nMarkAreaYTop;
            var nMarkAreaYBottom = this.markAreaYLeft[nIdx].nMarkAreaYBottom;
            var sMarkAreaFillColor = this.markAreaYLeft[nIdx].sMarkAreaFillColor;
            var nMarkAreaFillOpacity = this.markAreaYLeft[nIdx].nMarkAreaFillOpacity || .5;

            var nMarkAreaLineTopWidth = this.markAreaYLeft[nIdx].nMarkAreaLineTopWidth || 0;
            var sMarkAreaLineTopColor = this.markAreaYLeft[nIdx].sMarkAreaLineTopColor || sMarkAreaFillColor;
            var sMarkAreaLineTopOpacity = this.markAreaYLeft[nIdx].sMarkAreaLineTopOpacity || 1;
            var nMarkAreaLineBottomWidth = this.markAreaYLeft[nIdx].nMarkAreaLineBottomWidth || 0;
            var sMarkAreaLineBottomColor = this.markAreaYLeft[nIdx].sMarkAreaLineBottomColor || sMarkAreaFillColor;
            var sMarkAreaLineBottomOpacity = this.markAreaYLeft[nIdx].sMarkAreaLineBottomOpacity || 1;

            var sMarkAreaLineTopText = this.markAreaYLeft[nIdx].sMarkAreaLineTopText || "";
            var nMarkAreaLineTopTextLocation = this.markAreaYLeft[nIdx].nMarkAreaLineTopTextLocation || 1;
            var sMarkAreaLineTopTextFont = this.markAreaYLeft[nIdx].sMarkAreaLineTopTextFont || "bold 9pt 맑은 고딕";
            var sMarkAreaLineTopTextColor = this.markAreaYLeft[nIdx].sMarkAreaLineTopTextColor || sMarkAreaLineTopColor;

            var sMarkAreaLineBottomText = this.markAreaYLeft[nIdx].sMarkAreaLineBottomText || "";
            var nMarkAreaLineBottomTextLocation = this.markAreaYLeft[nIdx].nMarkAreaLineBottomTextLocation || 1;
            var sMarkAreaLineBottomTextFont = this.markAreaYLeft[nIdx].sMarkAreaLineBottomTextFont || "bold 9pt 맑은 고딕";
            var sMarkAreaLineBottomTextColor = this.markAreaYLeft[nIdx].sMarkAreaLineBottomTextColor || sMarkAreaLineBottomColor;

            var bHideTop = false;
            if (nMarkAreaYTop > this.maxY_Left) {
                nMarkAreaYTop = this.maxY_Left;
                bHideTop = true;
            };


            var bHideBottom = false;
            if (nMarkAreaYBottom < this.minY_Left) {
                nMarkAreaYBottom = this.minY_Left;
                bHideBottom = true;
            };


            var markArea = this.rect(
				Math.round(this.nPosLeft + 1)
				, Math.round(this.nPosBottom - this.nPixelUnitY_Left * (nMarkAreaYTop - this.minY_Left))
				, Math.round(this.nPosRight - this.nPosLeft) - .5
				, Math.round(this.nPixelUnitY_Left * (nMarkAreaYTop - nMarkAreaYBottom))
			).attr({
			    fill: sMarkAreaFillColor
				, "opacity": nMarkAreaFillOpacity
				, "stroke": sMarkAreaFillColor
			}).toFront();

            var nTopY = Math.round(this.nPosBottom - this.nPixelUnitY_Left * (nMarkAreaYTop - this.minY_Left)) + .5;
            var topLine = this.path(
				"M" + Math.round(this.nPosLeft + 1) + "," + nTopY + "L" + Math.round(this.nPosRight) + "," + nTopY
			).attr({
			    stroke: sMarkAreaLineTopColor
				, "opacity": sMarkAreaLineTopOpacity
				, "stroke-width": nMarkAreaLineTopWidth
				, "stroke-linejoin": "round"
			}).toFront(); ;

            var nBottomY = Math.round(this.nPosBottom - this.nPixelUnitY_Left * (nMarkAreaYTop - this.minY_Left) + this.nPixelUnitY_Left * (nMarkAreaYTop - nMarkAreaYBottom)) + .5;
            var bottomLine = this.path(
				"M" + Math.round(this.nPosLeft + 1) + "," + nBottomY + "L" + Math.round(this.nPosRight) + "," + nBottomY
			).attr({
			    stroke: sMarkAreaLineBottomColor
				, "opacity": sMarkAreaLineBottomOpacity
				, "stroke-width": nMarkAreaLineBottomWidth
				, "stroke-linejoin": "round"
			}).toFront(); ;

            if (sMarkAreaLineTopText.length > 0) {
                var topText = this.text(0, 0, sMarkAreaLineTopText);
                topText.attr({
                    font: sMarkAreaLineTopTextFont
					, fill: sMarkAreaLineTopTextColor
                });
                switch (nMarkAreaLineTopTextLocation) {
                    case 1: // Left
                        {
                            var nTopTextPosX = this.nPosLeft + (topText.getBBox().width / 2) + 2;
                            break;
                        };
                    case 2: // Center
                        {
                            var nTopTextPosX = this.nPosLeft + (this.nPosRight - this.nPosLeft) / 2;
                            break;
                        };
                    case 3: // Right
                        {
                            var nTopTextPosX = this.nPosRight - (topText.getBBox().width / 2) - 2;
                            break;
                        };
                };
                topText.attr({
                    x: nTopTextPosX
					, y: nTopY - (topText.getBBox().height * .5)
                }).toFront();
            };


            if (sMarkAreaLineBottomText.length > 0) {
                var bottomText = this.text(0, 0, sMarkAreaLineBottomText);
                bottomText.attr({
                    font: sMarkAreaLineBottomTextFont
					, fill: sMarkAreaLineBottomTextColor
                });
                switch (nMarkAreaLineBottomTextLocation) {
                    case 1: // Left
                        {
                            var nBottomTextPosX = this.nPosLeft + (bottomText.getBBox().width / 2) + 2;
                            break;
                        };
                    case 2: // Center
                        {
                            var nBottomTextPosX = this.nPosLeft + (this.nPosRight - this.nPosLeft) / 2;
                            break;
                        };
                    case 3: // Right
                        {
                            var nBottomTextPosX = this.nPosRight - (bottomText.getBBox().width / 2) - 2;
                            break;
                        };
                };
                bottomText.attr({
                    x: nBottomTextPosX
					, y: nBottomY + (bottomText.getBBox().height * .5)
                }).toFront();
            };

            if (bHideTop) {
                topLine.hide();
                topText.hide();
            };

            if (bHideBottom) {
                bottomLine.hide();
                bottomText.hide();
            };
        };
    };
    //markAreaYLeft
    ///////////////////////////////////////////////////////////////////////



    //////////////////////////////////////////////////////////////////////////
    //markAreaX
    if (this.markAreaX) {

        for (var nIdx = 0; nIdx < this.markAreaX.length; nIdx++) {
            var nMarkAreaStart = this.markAreaX[nIdx].nMarkAreaStart;
            var nMarkAreaEnd = this.markAreaX[nIdx].nMarkAreaEnd;
            var sMarkAreaFillColor = this.markAreaX[nIdx].sMarkAreaFillColor;
            var nMarkAreaFillOpacity = this.markAreaX[nIdx].nMarkAreaFillOpacity || .5;

            var nMarkAreaLineStartWidth = this.markAreaX[nIdx].nMarkAreaLineStartWidth || 0;
            var sMarkAreaLineStartColor = this.markAreaX[nIdx].sMarkAreaLineStartColor || sMarkAreaFillColor;
            var sMarkAreaLineStartOpacity = this.markAreaX[nIdx].sMarkAreaLineStartOpacity || 1;

            var nMarkAreaLineEndWidth = this.markAreaX[nIdx].nMarkAreaLineEndWidth || 0;
            var sMarkAreaLineEndColor = this.markAreaX[nIdx].sMarkAreaLineEndColor || sMarkAreaFillColor;
            var sMarkAreaLineEndOpacity = this.markAreaX[nIdx].sMarkAreaLineEndOpacity || 1;

            var sMarkAreaLineStartText = this.markAreaX[nIdx].sMarkAreaLineStartText || "";
            var nMarkAreaLineStartTextLocation = this.markAreaX[nIdx].nMarkAreaLineStartTextLocation || 1;
            var sMarkAreaLineStartTextFont = this.markAreaX[nIdx].sMarkAreaLineStartTextFont || "bold 9pt 맑은 고딕";
            var sMarkAreaLineStartTextColor = this.markAreaX[nIdx].sMarkAreaLineStartTextColor || sMarkAreaLineStartColor;

            var sMarkAreaLineEndText = this.markAreaX[nIdx].sMarkAreaLineEndText || "";
            var nMarkAreaLineEndTextLocation = this.markAreaX[nIdx].nMarkAreaLineEndTextLocation || 1;
            var sMarkAreaLineEndTextFont = this.markAreaX[nIdx].sMarkAreaLineEndTextFont || "bold 9pt 맑은 고딕";
            var sMarkAreaLineEndTextColor = this.markAreaX[nIdx].sMarkAreaLineEndTextColor || sMarkAreaLineEndColor;

            if (nMarkAreaStart > nMarkAreaEnd) {
                var nTemp = nMarkAreaEnd;
                nMarkAreaEnd = nMarkAreaStart;
                nMarkAreaStart = nTemp;
            };


            var markAreaX = this.rect(
				Math.round(this.nPaddingLeft + this.nPixelLabelX * (nMarkAreaStart + (this.nXAxisLabelLocation || 0))) + .5
				, Math.round(this.nPosTop) + .5
				, Math.round(this.nPixelLabelX * (nMarkAreaEnd - nMarkAreaStart)) - .5
				, Math.round(this.nPosBottom - this.nPosTop) - .5
			).attr({
			    fill: sMarkAreaFillColor
				, "opacity": nMarkAreaFillOpacity
				, "stroke": sMarkAreaFillColor
			}).toFront();

            var nStartX = Math.round(this.nPaddingLeft + this.nPixelLabelX * (nMarkAreaStart + (this.nXAxisLabelLocation || 0))) + .5;
            var nStartY_1 = Math.round(this.nPosTop) + .5
            var nStartY_2 = Math.round(this.nPosBottom) - .5
            var startLine = this.path(
				"M" + nStartX + "," + nStartY_1 + "L" + nStartX + "," + nStartY_2
			).attr({
			    stroke: sMarkAreaLineStartColor
				, "opacity": sMarkAreaLineStartOpacity
				, "stroke-width": nMarkAreaLineStartWidth
				, "stroke-linejoin": "round"
			}).toFront();


            var nEndX = Math.round(this.nPaddingLeft + this.nPixelLabelX * (nMarkAreaEnd + (this.nXAxisLabelLocation || 0))) + .5;
            var nEndY_1 = Math.round(this.nPosTop) + .5
            var nEndY_2 = Math.round(this.nPosBottom) - .5
            var EndLine = this.path(
				"M" + nEndX + "," + nEndY_1 + "L" + nEndX + "," + nEndY_2
			).attr({
			    stroke: sMarkAreaLineEndColor
				, "opacity": sMarkAreaLineEndOpacity
				, "stroke-width": nMarkAreaLineEndWidth
				, "stroke-linejoin": "round"
			}).toFront(); ;



            if (sMarkAreaLineStartText.length > 0) {
                var startText = this.text(0, 0, sMarkAreaLineStartText);

                startText.attr({
                    font: sMarkAreaLineStartTextFont
					, fill: sMarkAreaLineStartTextColor
                }).toFront();

                switch (nMarkAreaLineStartTextLocation) {
                    case 1: // Top
                        {
                            var nStartTextPosY = this.nPosTop + (startText.getBBox().width / 2) + 2;
                            break;
                        };
                    case 2: // Middle
                        {
                            var nStartTextPosY = this.nPosTop + (this.nPosBottom - this.nPosTop) / 2;
                            break;
                        };
                    case 3: // Bottom
                        {
                            var nStartTextPosY = this.nPosBottom - (startText.getBBox().width / 2) - 2;
                            break;
                        };
                };
                startText.attr({
                    x: nStartX - (startText.getBBox().height * .5)
					, y: nStartTextPosY
                }).toFront();

                startText.transform("r-90")
            };



            if (sMarkAreaLineEndText.length > 0) {
                var endText = this.text(0, 0, sMarkAreaLineEndText);

                endText.attr({
                    font: sMarkAreaLineEndTextFont
					, fill: sMarkAreaLineEndTextColor
                }).toFront();

                switch (nMarkAreaLineEndTextLocation) {
                    case 1: // Top
                        {
                            var nEndTextPosY = this.nPosTop + (endText.getBBox().width / 2) + 2;
                            break;
                        };
                    case 2: // Middle
                        {
                            var nEndTextPosY = this.nPosTop + (this.nPosBottom - this.nPosTop) / 2;
                            break;
                        };
                    case 3: // Bottom
                        {
                            var nEndTextPosY = this.nPosBottom - (endText.getBBox().width / 2) - 2;
                            break;
                        };
                };
                endText.attr({
                    x: nEndX + (endText.getBBox().height * .5)
					, y: nEndTextPosY
                }).toFront();

                endText.transform("r-90")
            };
        };
    };
    //markAreaX
    //////////////////////////////////////////////////////////////////////////

};

Raphael.fn.drawGrid = function() {

    var sColorLine = this.sColorLine || "#000000";
    var sColorArea = this.sColorArea;

    /////////////////////////////////////////
    //Y축 라벨을 구성
    var array_YLabelLeft = [];
    var array_YLabelRight = [];

    if (this.nY || 0) {
        if (this.dataGanttBar.length > 0) {
            var dtEnd = this.dataGanttBar[0].dt_Gantt_End;
            for (nIdx = 0; nIdx <= this.nY || 0; nIdx++) {
                //array_YLabelLeft.push(getLen2(dtEnd.getMonth() + 1) + "-" + getLen2(dtEnd.getDate()) + " " + getLen2(dtEnd.getHours()) + ":" + getLen2(dtEnd.getMinutes()));
                array_YLabelLeft.push(getLen2(dtEnd.getHours()) + ":" + getLen2(dtEnd.getMinutes()));
                dtEnd.dateAdd(this.dataGanttBar[0].s_Gantt_Term, (this.maxY_Left / this.nY) * -1);
            };
        } else {
            for (nIdx = 0; nIdx <= this.nY || 0; nIdx++) {
                if (this.sYAxisLeftFormatNumber || 0) {
                    array_YLabelLeft.push(input_comma_Number((this.maxY_Left - ((this.maxY_Left - this.minY_Left) / this.nY * nIdx)).toFixed(this.nYAxisDecimal || 0)) + (this.sYAxisLeftLabelUnit || ""));
                } else {
                    array_YLabelLeft.push((this.maxY_Left - ((this.maxY_Left - this.minY_Left) / this.nY * nIdx)).toFixed(this.nYAxisDecimal || 0) + (this.sYAxisLeftLabelUnit || ""));
                };

                if (this.sYAxisRightFormatNumber || 0) {
                    array_YLabelRight.push(input_comma_Number((this.maxY_Right - ((this.maxY_Right - this.minY_Right) / this.nY * nIdx)).toFixed(this.nXAxisDecimal || 0)) + (this.sYAxisRightLabelUnit || ""));
                } else {
                    array_YLabelRight.push((this.maxY_Right - ((this.maxY_Right - this.minY_Right) / this.nY * nIdx)).toFixed(this.nXAxisDecimal || 0) + (this.sYAxisRightLabelUnit || ""));
                };
            };
        };
        this.sLabelYLeft = array_YLabelLeft;
        this.sLabelYRight = array_YLabelRight;
    };
    //Y축 라벨을 구성
    /////////////////////////////////////////


    //XY Reverse인 경우 각 축의 Label을 치환
    if ((this.nReverseXY || 0) == 1) {
        var array_YLabelLeft_temp = array_YLabelLeft;
        array_YLabelLeft = [];

        for (var nIdx = 0; nIdx < this.sXAxisLabel.length || 0; nIdx++) {
            array_YLabelLeft.push(this.sXAxisLabel[nIdx]);
        };

        this.nY = this.sXAxisLabel.length;
        this.sLabelYLeft = array_YLabelLeft;
        this.sXAxisLabel = array_YLabelLeft_temp.reverse();
        this.sLabelYRight = [];
        this.refreshChartAreaMargin();
    };
    //XY Reverse인 경우 각 축의 Label을 치환
    /////////////////////////////////////////


    /////////////////////////////////////////
    //X축 라벨을 그려줌
    if (this.dataLine.length >= 0 || this.dataBar.length >= 0) { //this.dataPie.length == 0
        for (var nIdx = 0; nIdx < this.sXAxisLabel.length; nIdx++) {
            if ((this.nReverseXY || 0) == 1) {
                var x = Math.round(this.nPaddingLeft + this.nPixelLabelX * (nIdx + (this.nLeftYAxisLocation || 0)));
                var t = this.text(x, 0, this.sXAxisLabel[nIdx]).attr({
                    font: this.sXAxisLabelFont || "bold 9pt 맑은 고딕",
                    fill: this.sXAxisLabelColor || "#000000"
                }).toBack();
                var nHeightBox = t.getBBox().height;

                if ((this.nUseTopXLabel || 0) == 1) {
                    var nPosY = this.nPaddingTop + (nHeightBox / 2) - 4;
                    if (nIdx == this.sXAxisLabel.length - 1) {
                        this.nPaddingTop = this.nPaddingTop + nHeightBox;
                        this.nPaddingBottom = this.nPaddingBottom - nHeightBox;

                        this.nPosTop = this.nPaddingTop;
                        this.nPosBottom = this.height - this.nPaddingBottom;
                    };
                } else {
                    var nPosY = this.height - this.nPaddingBottom + (nHeightBox / 2) + 4;
                };

                this.nHeightXlableBox = nHeightBox;

                t.attr({ y: nPosY });

                if (x > this.width - this.nPaddingRight) {
                    t.remove();
                };
            } else {
                if ((this.nXAxisLabelStep || 0) == 0 || nIdx % this.nXAxisLabelStep == this.nXAxisLabelStep - 1 || nIdx == 0) {
                    //var t = this.text(this.nPaddingLeft + this.nPixelLabelX * nIdx, 0, this.sXAxisLabel[nIdx]).attr({
                    var t = this.text(this.nPaddingLeft + this.nPixelLabelX * (nIdx + (this.nXAxisLabelLocation || .5)), 0, this.sXAxisLabel[nIdx]).attr({
                        font: this.sXAxisLabelFont || "bold 9pt 맑은 고딕",
                        fill: this.sXAxisLabelColor || "#000000"
                    }).toBack();
                    var nHeightBox = t.getBBox().height;

                    if ((this.nUseTopXLabel || 0) == 1) {
                        var nPosY = this.nPaddingTop + (nHeightBox / 2) - 4;
                        if (nIdx == this.sXAxisLabel.length - 1) {
                            this.nPaddingTop = this.nPaddingTop + nHeightBox;
                            this.nPaddingBottom = this.nPaddingBottom - nHeightBox;

                            this.nPosTop = this.nPaddingTop;
                            this.nPosBottom = this.height - this.nPaddingBottom;
                        }
                    } else {
                        var nPosY = this.height - this.nPaddingBottom + (nHeightBox / 2) + 4;
                    };

                    this.nHeightXlableBox = nHeightBox;

                    t.attr({ y: nPosY });

                    if (x > this.width - this.nPaddingRight) {
                        t.remove();
                    };
                };
            };
        };
    };
    //X축 라벨을 그려줌
    /////////////////////////////////////////


    /////////////////////////////////////////
    //Y축 영역구분선을 그려줌
    if (this.nY || 0) {
        var nHeightArea = (this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY;

        for (nIdx = 1; nIdx < this.nY; nIdx++) {
            if (nIdx % 2 == 1) {
                this.rect(Math.round(this.nPosLeft) + .5, Math.round(this.nPosTop + nHeightArea * nIdx) + .5, Math.round(this.width - this.nPaddingLeft - this.nPaddingRight), Math.round(nHeightArea))
				.attr({
				    fill: sColorArea
					, "stroke-width": 0
				});
            };
            var nPosLine_Y = Math.round(this.nPosTop + nHeightArea * nIdx) + .5;
            this.path("M" + this.nPosLeft + "," + nPosLine_Y + "L" + this.nPosRight + "," + nPosLine_Y).attr({ stroke: this.sColorLine || this.sDefaultTxtColor }).toFront(); ;
        };
    };
    //Y축 영역구분선을 그려줌
    /////////////////////////////////////////


    /////////////////////////////////////////
    //Y축 Label Title을 그려줌
    if (this.sLeftTitleY || false) {
        var sLeftTitleYText = this.text(0, 0, this.sLeftTitleY).attr({ font: this.sLeftTitleFontY || "bold 9pt 맑은 고딕", fill: (this.sLeftTitleColorY || this.sDefaultTxtColor) || "#000000" });
        sLeftTitleYText.attr({ x: this.nPaddingLeft - sLeftTitleYText.getBBox().width / 2 - 5, y: this.nPaddingTop - sLeftTitleYText.getBBox().height });
    };

    if (this.sRightTitleY || false) {
        var sRightTitleYText = this.text(0, 0, this.sRightTitleY).attr({ font: this.sRightTitleFontY || "bold 9pt 맑은 고딕", fill: (this.sRightTitleColorY || this.sDefaultTxtColor) || "#000000" });
        sRightTitleYText.attr({ x: this.width - this.nPaddingRight + sRightTitleYText.getBBox().width / 2 + 5, y: this.nPaddingTop - sRightTitleYText.getBBox().height });
    };
    //Y축 Label Title을 그려줌
    /////////////////////////////////////////


    /////////////////////////////////////////
    //Y축 Tick을 그려줌
    (this.nYAxisTick < 0) ? 0 : this.nYAxisTick = this.nYAxisTick || 0;
    if (this.nYAxisTick) {
        for (nIdx = 0; nIdx <= this.nY; nIdx++) {
            if (((this.nXAxisLabelStep || 0) == 0 || nIdx % this.nXAxisLabelStep == this.nXAxisLabelStep - 1 || nIdx == 0) || (this.nReverseXY || 0) == 0) {
                if (this.maxY_Left > 0) {
                    var nPosX_S_Left = Math.round(this.nPaddingLeft) + .5;
                    var nPosX_E_Left = Math.round(nPosX_S_Left - this.nYAxisTick) + .5;
                    var nPosY_Left = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * nIdx + this.nPaddingTop) + .5;

                    this.path("M" + nPosX_S_Left + "," + nPosY_Left + "L" + nPosX_E_Left + "," + nPosY_Left).attr({ stroke: this.sColorLine || this.sDefaultTxtColor });
                };

                if (this.maxY_Right > 0) {
                    var nPosX_S_Right = Math.round(this.width - this.nPaddingRight) + .5;
                    var nPosX_E_Right = Math.round(nPosX_S_Right + this.nYAxisTick) + .5;
                    var nPosY_Right = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * nIdx + this.nPaddingTop) + .5;

                    this.path("M" + nPosX_S_Right + "," + nPosY_Right + "L" + nPosX_E_Right + "," + nPosY_Right).attr({ stroke: this.sColorLine || this.sDefaultTxtColor });
                };
            };
        };
    };
    //Y축 Tick을 그려줌
    /////////////////////////////////////////


    /////////////////////////////////////////
    //X축 Tick을 그려줌
    if (this.nXAxisTick || false) {
        for (nIdx = 0; nIdx <= this.sXAxisLabel.length; nIdx++) {
            if (((this.nXAxisTickStep || 0) == 0 || nIdx % this.nXAxisTickStep == this.nXAxisTickStep - 1 || nIdx == 0)) {
                var nPosX = Math.round(this.nPaddingLeft + (this.nPixelLabelX * (nIdx + (this.nXAxisTickLocation || 0)))) + .5;
                var nPosY_S = this.height - this.nPaddingBottom;
                var nPosY_E = this.height - this.nPaddingBottom - this.nXAxisTick;
                (nPosY_E < this.nPaddingTop) ? nPosY_E = this.nPaddingTop : nPosY_E = nPosY_E;
                (nPosY_E > this.height) ? nPosY_E = this.height : nPosY_E = nPosY_E;

                this.path("M" + nPosX + "," + nPosY_S + "L" + nPosX + "," + nPosY_E).attr({ stroke: (this.sColorLine || sColorLine) || this.sDefaultTxtColor, "stroke-width": this.sXAxisTickWidth || .5 });
            };
        };
    };
    //X축 Tick을 그려줌
    /////////////////////////////////////////


    /////////////////////////////////////////
    //Y축 Label을 생성
    if (this.nY || 0) {
        if (this.maxY_Left > 0) {
            for (var nIdx = 0; nIdx < this.sLabelYLeft.length || 0; nIdx++) {
                if ((this.nReverseXY || 0) == 1) {
                    var nPosYLabelLeft = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx + .5) + this.nPaddingTop) + .5;
                    //var nPosYLabelLeft = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx - (this.nLeftYAxisLocation || 0)) + this.nPaddingTop) + .5;

                    if ((this.nXAxisLabelStep || 0) == 0 || nIdx % this.nXAxisLabelStep == this.nXAxisLabelStep - 1 || nIdx == 0) {
                        var txt_Left = this.text(0, nPosYLabelLeft, this.sLabelYLeft[nIdx]).attr({
                            font: this.sYAxisLeftFont || "bold 9pt 맑은 고딕",
                            fill: (this.sYAxisLeftColor || this.sDefaultTxtColor) || "#000000"
                        });
                        txt_Left.attr({ x: (this.nPaddingLeft - txt_Left.getBBox().width / 2) - (this.nYAxisLabelPaddingRight || 0) - this.nYAxisTick });

                        if (nPosYLabelLeft < this.nPaddingTop) {
                            txt_Left.remove();
                        };
                    };
                } else {
                    var nPosYLabelLeft = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx - (this.nLeftYAxisLocation || 0)) + this.nPaddingTop) + .5;
                    var txt_Left = this.text(0, nPosYLabelLeft, this.sLabelYLeft[nIdx]).attr({
                        font: this.sYAxisLeftFont || "bold 9pt 맑은 고딕",
                        fill: (this.sYAxisLeftColor || this.sDefaultTxtColor) || "#000000"
                    });
                    txt_Left.attr({ x: (this.nPaddingLeft - txt_Left.getBBox().width / 2 - 2) - (this.nYAxisLabelPaddingRight || 0) - this.nYAxisTick });

                    if (nPosYLabelLeft < this.nPaddingTop) {
                        txt_Left.remove();
                    };
                };
            };
        };

        if (this.maxY_Right > 0) {
            for (var nIdx = 0; nIdx < this.sLabelYRight.length || 0; nIdx++) {
                var nPosYLabelRight = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx - (this.nRightYAxisLocation || 0)) + this.nPaddingTop) + .5;

                var txt_Right = this.text(0, nPosYLabelRight, this.sLabelYRight[nIdx]).attr({
                    font: this.sYAxisRightFont || "bold 9pt 맑은 고딕",
                    fill: (this.sYAxisRightColor || this.sDefaultTxtColor) || "#000000"
                });
                txt_Right.attr({ x: (this.width - this.nPaddingRight + txt_Right.getBBox().width / 2) + 5 + this.nYAxisTick });

                if (nPosYLabelRight < this.nPaddingTop) {
                    txt_Right.remove();
                };
            };
        };
    };
    //Y축 Label을 생성
    /////////////////////////////////////////


    /////////////////////////////////////////
    //전체 영역라인을 그려줌
    this.rect(Math.round(this.nPosLeft) + .5, Math.round(this.nPosTop) + .5, Math.round(this.width - this.nPaddingLeft - this.nPaddingRight) + .5, Math.round(this.height - this.nPaddingTop - this.nPaddingBottom)).attr({
        stroke: sColorLine
    });
    //전체 영역라인을 그려줌
    /////////////////////////////////////////



    /////////////////////////////////////////
    //XAxis Border Setting
    if ((this.nUseTopXLabel || 0) == 1) {
        var sPathXAxis = "M" + Math.round(this.nPaddingLeft) + "," + this.nPaddingTop + "L" + Math.round(this.width - this.nPaddingRight) + "," + this.nPaddingTop;
    } else {
        var sPathXAxis = "M" + Math.round(this.nPaddingLeft) + "," + (this.height - this.nPaddingBottom + (this.nXAxisBorderWidth || 0) / 2) + "L" + Math.round(this.width - this.nPaddingRight) + "," + (this.height - this.nPaddingBottom + (this.nXAxisBorderWidth || 0) / 2);
    };


    this.path(sPathXAxis).attr({
        stroke: this.sXAxisBorderColor || sColorLine
		, "stroke-width": this.nXAxisBorderWidth || 1
    }).toFront();


    //XAxis Border Setting
    /////////////////////////////////////////



    /////////////////////////////////////////
    //LeftYAxis Border Setting
    var sPathLeftYAxis = "M" + Math.round(this.nPaddingLeft - (this.nXAxisBorderWidth || 0) / 2) + "," + this.nPaddingTop + "L" + Math.round(this.nPaddingLeft + (this.nXAxisBorderWidth || 0) / 2) + "," + (this.height - this.nPaddingBottom + (this.nXAxisBorderWidth || 0) / 2);

    this.path(sPathLeftYAxis).attr({
        stroke: this.sLeftYAxisBorderColor || sColorLine
		, "stroke-width": this.nLeftYAxisBorderWidth || 1
    }).toFront();
    //XAxis Border Setting
    /////////////////////////////////////////




    /////////////////////////////////////////
    //RightYAxis Border Setting
    var sPathRightYAxis = "M" + Math.round(this.width - this.nPaddingRight - (this.nYAxisRightBorderWidth || 0) / 2) + "," + this.nPaddingTop + "L" + Math.round(this.width - this.nPaddingRight + (this.nYAxisRightBorderWidth || 0) / 2) + "," + (this.height - this.nPaddingBottom + (this.nXAxisBorderWidth || 0) / 2);

    this.path(sPathRightYAxis).attr({
        stroke: this.nYAxisRightBorderColor || sColorLine
		, "stroke-width": this.nYAxisRightBorderWidth || 1
    }).toFront();
    //XAxis Border Setting
    /////////////////////////////////////////

    return true;
};



Raphael.fn.drawLegend = function() {

    var nVertival = this.classLegend.nLegendVertical || 1;
    var nLocationY = this.classLegend.nLegendLocationY || 1;
    var nLocationX = this.classLegend.nLegendLocationX || 1;
    var nLegendMarginX = this.classLegend.nLegendMarginX || 10;
    var nLegendMarginY = this.classLegend.nLegendMarginY || 10;
    var nSizeKey = this.classLegend.nLegendKeySize || 20;
    var nSizeText = this.classLegend.nLegendTextSize || 20;
    var nPaddingText = this.classLegend.nLegendTextPadding || 10;
    var nMarginLeft = this.classLegend.nLegendTextMarginLeft || 10;
    var nMarginRight = this.classLegend.nLegendTextMarginRight || 10;
    var sLegendFont = this.classLegend.sLegendFont || "bold 9pt 맑은 고딕";

    var nPosBoxY = (this.nPaddingTop / 2 - 12) + .5;
    if ((this.nUseTopXLabel || 0) == 1) {
        nPosBoxY = nPosBoxY - this.nHeightXlableBox / 2;
    };

    var array_text = [];
    var array_key = [];

    var array_dot = [];

    var nCountLegend = this.classLegend.jsonLegendKey.length;

    //Legend Text를 한번 돌면서 Text Width를 최대치로 통일 시키기 위함
    for (var nIdx = 0; nIdx < nCountLegend; nIdx++) {
        var sType = this.classLegend.jsonLegendKey[nIdx].sType;
        var sText = this.classLegend.jsonLegendKey[nIdx].sText;
        var sAreaColor = this.classLegend.jsonLegendKey[nIdx].sAreaColor;
        var sTxtColor = this.classLegend.jsonLegendKey[nIdx].sTxtColor;

        var t = this.text(0, 0, sText).attr({ font: sLegendFont, fill: sTxtColor }).hide();

        switch (sType) {
            case 1: //Rect
                {
                    var k = this.rect(0, 0, nSizeKey, 11).attr({ fill: sAreaColor, stroke: "#000000" }).hide();
                    break;
                };
            case 2: //Line
                {
                    var k = this.rect(0, 0, nSizeKey, 3).attr({ fill: sAreaColor, stroke: sAreaColor }).hide();
                    break;
                };
            case 3: //DotLine
                {
                    var k = this.rect(0, 0, nSizeKey, 3).attr({ fill: sAreaColor, stroke: sAreaColor }).hide();
                    break;
                };
        };


        (t.getBBox().width > nSizeText) ? nSizeText = t.getBBox().width : nSizeText = nSizeText;

        array_text.push(t);
        array_key.push(k);
    };

    //각 Legend(key + text) 크기를 설정
    var nSizeLegend = Math.round(nSizeKey + nSizeText + nPaddingText + nMarginLeft + nMarginRight);

    //Legend 크기의 합계가 Chart 크기보다 크면 Legend 크기를 조정함
    if (nVertival == 1) {
        (nSizeLegend * nCountLegend > this.width) ? nSizeLegend = (this.width / nCountLegend) - 5 : nSizeLegend = nSizeLegend;
    };

    for (var nIdx = 0; nIdx < nCountLegend; nIdx++) {
        if (nVertival == 1) {
            var nPosX = (this.width / 2) + (nSizeLegend * nCountLegend / 2) - (nSizeLegend * (nCountLegend - nIdx)) + nMarginLeft - nPaddingText;
            var nPosY = this.nPaddingTop / 2;

            if ((this.nUseTopXLabel || 0) == 1) {
                nPosY = nPosY - this.nHeightXlableBox / 2;
            };
        } else {

            var nPosX = (this.width / 2) + nMarginLeft - (nSizeLegend / 2);
            var nPosY = this.nPaddingTop / 2 + ((array_text[0].getBBox().height + 5) * nIdx);

            if ((this.nUseTopXLabel || 0) == 1) {
                nPosY = nPosY - this.nHeightXlableBox / 2;
            };
        };

        array_key[nIdx].attr({ x: nPosX, y: nPosY - array_key[nIdx].getBBox().height / 2 }).show();

        if (this.classLegend.jsonLegendKey[nIdx].sType == 3) {
            var sAreaColor = this.classLegend.jsonLegendKey[nIdx].sAreaColor;
            var d = this.circle(nPosX + nSizeKey / 2, nPosY, 4).attr({ fill: sAreaColor, "fill-opacity": 1, stroke: sAreaColor, "stroke-width": 5, "stroke-opacity": .3 });

            array_dot.push(d);
        };

        array_text[nIdx].attr({
            x: nPosX + nSizeKey + (array_text[nIdx].getBBox().width / 2) + nPaddingText
			, y: nPosY - 1
        }).show();

        var onclick = this.classLegend.jsonLegendKey[nIdx].onclick;

        if (onclick || 0 > 0) {
            array_text[nIdx].hover(function() {
                $("#frmMain").css("cursor", "pointer");
            }, function() {
                $("#frmMain").css("cursor", "default");
            });

            array_text[nIdx].click(onclick);

            array_key[nIdx].hover(function() {
                $("#frmMain").css("cursor", "pointer");
            }, function() {
                $("#frmMain").css("cursor", "default");
            });

            array_key[nIdx].click(onclick);
        };
    };

    if (nVertival == 1) {
        var rectLegend = this.rect(
			(this.width / 2) + (nSizeLegend * nCountLegend / 2) - (nSizeLegend * nCountLegend) - nPaddingText,
			nPosBoxY,
        //nSizeLegend * (nCountLegend) + nMarginLeft + nMarginRight,
			nSizeLegend * (nCountLegend - 1) + array_text[nCountLegend - 1].getBBox().width + array_key[nCountLegend - 1].getBBox().width + nMarginLeft + nMarginRight + nPaddingText,
			24,
			this.classLegend.nLegendRadiusBorder || 0
		).attr({ fill: this.classLegend.sLegendColorBg || "#FFFFFF", stroke: this.classLegend.sLegendColorBorder || "#000000" }).toFront();
    } else {
        var rectLegend = this.rect(
			(this.width / 2) - (nSizeLegend / 2),
			nPosBoxY,
			nSizeLegend,
			(array_text[0].getBBox().height + 5) * nCountLegend + 2,
			this.classLegend.nLegendRadiusBorder || 0
		).attr({ fill: this.classLegend.sLegendColorBg || "#FFFFFF", stroke: this.classLegend.sLegendColorBorder || "#000000" }).toFront();
    };

    var nShiftY = 0;
    switch (nLocationY) {
        case 2: //Middle
            {
                nShiftY = (this.height - this.nPaddingTop - this.nPaddingBottom) / 2 - (rectLegend.getBBox().height / 2);
                break;
            };
        case 3: //Bottom
            {
                nShiftY = this.height - this.nPaddingBottom - rectLegend.getBBox().height - nLegendMarginY;
                break;
            };
    };

    var nShiftX = 0;
    switch (nLocationX) {
        case 2: //Left
            {
                nShiftX = (this.width - rectLegend.getBBox().width) / 2 * -1 + nLegendMarginX;
                break;
            };
        case 3: //Right
            {
                nShiftX = (this.width / 2) - (rectLegend.getBBox().width / 2) - nLegendMarginX;
                break;
            };
    };

    rectLegend.attr({
        y: rectLegend.attr("y") + nShiftY
		, x: rectLegend.attr("x") + nShiftX
    });

    array_key.forEach(function(objKey) {
        objKey.attr({
            y: objKey.attr("y") + nShiftY
			, x: objKey.attr("x") + nShiftX
        });
        objKey.toFront();
    });

    array_text.forEach(function(objTxt) {
        objTxt.attr({
            y: objTxt.attr("y") + nShiftY
			, x: objTxt.attr("x") + nShiftX
        });
        objTxt.toFront();
    });

    array_dot.forEach(function(objDot) {
        objDot.attr({
            y: objDot.attr("y") + nShiftY
			, x: objDot.attr("x") + nShiftX
        });
        objDot.toFront();
    });
};







////////////////////////////////////////////////
//drawGanttBarChart
Raphael.fn.drawGanttBarChart = function() {
    var nBarGap = this.nBarGap || 0.5;
    (nBarGap > 0.9 || nBarGap < 0.1) ? nBarGap = 0.1 : nBarGap = nBarGap || 1 / (this.dataSideBar.length + 1);

    var nCountBar = this.dataGanttBar.length || 0;

    var nWidthBar = (this.height - this.nPaddingTop - this.nPaddingBottom) / nCountBar * (1 - nBarGap);

    if ((this.nReverseXY || 0) == 1) {
        var dataLabel = this.sLabelYLeft;
    } else {
        var dataLabel = this.sXAxisLabel;
    };

    for (var nIdx_1 = 0; nIdx_1 < this.dataGanttBar.length; nIdx_1++) {
        var array_MC_data = this.dataGanttBar[nIdx_1].data;
        var nPosY = Math.round(this.nPaddingTop + ((this.height - this.nPaddingTop - this.nPaddingBottom) / nCountBar) * (nIdx_1 + .5) - (nWidthBar / 2));

        for (var nIdx_2 = 0; nIdx_2 < array_MC_data.length; nIdx_2++) {
            var n_Gantt_ID = array_MC_data[nIdx_2].n_Gantt_ID;
            var n_Group_ID = array_MC_data[nIdx_2].n_Group_ID;
            var dt_Start = array_MC_data[nIdx_2].dt_Start;
            var dt_End = array_MC_data[nIdx_2].dt_End;
            var s_State = array_MC_data[nIdx_2].s_State;
            var s_Color_Bg = array_MC_data[nIdx_2].s_Color_Bg;
            var s_Color_Txt = array_MC_data[nIdx_2].s_Color_Txt;
            var onclick = array_MC_data[nIdx_2].onclick;
            var onmouseover = array_MC_data[nIdx_2].onmouseover;
            var onmouseout = array_MC_data[nIdx_2].onmouseout;
            var n_Display = array_MC_data[nIdx_2].n_Display;

            if (dt_Start.length > 0) {
                var n_Pos_X_Start = (this.nPaddingLeft + 1) + (DateDiff(this.dataGanttBar[0].s_Gantt_Term, this.dataGanttBar[0].dt_Gantt_Start, dt_Start) * this.nPixelUnitY_Left);
                var n_Pos_X_End = DateDiff(this.dataGanttBar[0].s_Gantt_Term, dt_Start, dt_End) * this.nPixelUnitY_Left;

                if (nIdx_2 == array_MC_data.length - 1) { n_Pos_X_End = n_Pos_X_End - 1; };


                var objBar = this.rect(n_Pos_X_Start, nPosY, 0, nWidthBar).attr({ fill: s_Color_Bg, stroke: this.dataGanttBar[0].s_Gantt_Color_Border || s_Color_Bg, "stroke-width": .5, opacity: n_Display })
					.animate(Raphael.animation({ width: n_Pos_X_End }, this.nDrawSec));

                if (n_Display > 0) {
                    objBar.click(onclick);

                    objBar.hover(function() {
                        $("#frmMain").css("cursor", "pointer");
                    }, function() {
                        $("#frmMain").css("cursor", "default");
                    });
                };

                if (n_Display > 0) {
                    objBar.mouseover(onmouseover);
                };

                if (n_Display > 0) {
                    objBar.mouseout(onmouseout);
                };

            };
        };
    };
};
//drawGanttBarChart
////////////////////////////////////////////////



Raphael.fn.drawStackBarChart = function() {
    var nBarGap = this.nBarGap || 0.5;

    (nBarGap > 0.9 || nBarGap < 0.1) ? nBarGap = 0.1 : nBarGap = nBarGap || 1 / (this.dataSideBar.length + 1);

    var blanket = this.set();   // POP UP 처리를 하기위한 영역
    var pop_box = this.set();   // POP_UP 영역
    var pop_text = this.set();  // POP_UP TEXT

    var nCountBar = 1;
    nCountBar = nCountBar + this.dataSideBar.length || 0;

    var nWidthBar = this.dataStackBar[0].width / nCountBar || this.nPixelLabelX * (1 - nBarGap) / nCountBar;

    if ((this.nReverseXY || 0) == 1) {
        nWidthBar = (this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY / nCountBar * (1 - nBarGap);
    };

    var arrayBar = [];
    var arrayAnim = [];

    if ((this.nReverseXY || 0) == 1) {
        var dataLabel = this.sLabelYLeft;
    } else {
        var dataLabel = this.sXAxisLabel;
    };

    var nDelay = this.nDrawSec / dataLabel.length;

    var arrayPosY = [];
    var arrayPosX = [];

    if ((this.sLegendDisplay || 0) > 0) {
        if ((this.classLegend || 0) == 0) {
            this.classLegend = this.addLegend();
        };
        this.classLegend.nLegendVertical = this.nLegendVertical || 1;
        this.classLegend.nLegendLocationY = this.nLegendLocationY || 1;
        this.classLegend.nLegendLocationX = this.nLegendLocationX || 1;
        this.classLegend.nLegendMarginX = this.nLegendMarginX || 10;
        this.classLegend.nLegendMarginY = this.nLegendMarginY || 10;
        this.classLegend.sLegendFont = this.sLegendFont || "bold 9pt 맑은 고딕";
        this.classLegend.nLegendKeySize = this.nLegendKeySize || 20;
        this.classLegend.nLegendTextSize = this.nLegendTextSize || 20;
        this.classLegend.nLegendTextPadding = this.nLegendTextPadding || 5;
        this.classLegend.nLegendTextMarginLeft = this.nLegendTextMarginLeft || 10;
        this.classLegend.nLegendTextMarginRight = this.nLegendTextMarginRight || 10;
        this.classLegend.sLegendColorBg = this.sLegendColorBg || this.sColorArea;
        this.classLegend.sLegendColorBorder = this.sLegendColorBorder || "#555555";
        this.classLegend.nLegendRadiusBorder = this.nLegendRadiusBorder || 0;
    };

    for (var nIdx = 0, nIdxMax = this.dataStackBar.length; nIdx < nIdxMax; nIdx++) {
        cData = this.dataStackBar[nIdx];
        if (cData.baseYAxis == 1) {
            var nPixelUnit = this.nPixelUnitY_Left;
        } else {
            var nPixelUnit = this.nPixelUnitY_Right;
        };

        for (var i = 0, nLabelMax = dataLabel.length; i < nLabelMax; i++) {
            if ((this.nReverseXY || 0) == 1) {
                var nPosY = this.nPaddingTop + ((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY) * (i + .5) - (nWidthBar / 2 * nCountBar) + nWidthBar * this.dataSideBar.length;

                if (nIdx == 0) {
                    var nPosX = this.nPaddingLeft + 1;
                } else {
                    var nPosX = arrayPosX[i + ((nIdx - 1) * nLabelMax)];
                };

                arrayPosX.push(nPosX + nPixelUnit * cData.data[i]);
                arrayPosY.push(nPosY);

                var objBar = this.rect(this.nPaddingLeft + 1, nPosY, 0, nWidthBar).attr({ fill: cData.color, stroke: cData.colorStroke || cData.color, "stroke-width": cData.strokeWidth || .5 });
                var anmBar = Raphael.animation({ x: nPosX, width: nPixelUnit * cData.data[i] }, this.nDrawSec);

                blanket.push(this.rect(nPosX, nPosY, nPixelUnit * cData.data[i], nWidthBar).attr({ stroke: "none", fill: "#FFFFFF", opacity: 0 }));
            } else {
                var nPosX = this.nPaddingLeft + this.nPixelLabelX * (i + .5) - (nWidthBar / 2 * nCountBar) + nWidthBar * this.dataSideBar.length;
                if (nIdx == 0) {
                    var nPosY = this.height - this.nPaddingBottom - nPixelUnit * cData.data[i];
                } else {
                    var nPosY = arrayPosY[i + ((nIdx - 1) * nLabelMax)] - nPixelUnit * cData.data[i];
                };

                arrayPosX.push(nPosX);
                arrayPosY.push(nPosY);

                var objBar = this.rect(nPosX, this.height - this.nPaddingBottom, nWidthBar, 0).attr({ fill: cData.color, stroke: cData.colorStroke || cData.color, "stroke-width": cData.strokeWidth || .5 });
                var anmBar = Raphael.animation({ y: nPosY + 1, height: nPixelUnit * cData.data[i] }, this.nDrawSec);

                blanket.push(this.rect(nPosX, nPosY, nWidthBar, nPixelUnit * cData.data[i]).attr({ stroke: "none", fill: "#FFFFFF", opacity: 0 }));
            };

            arrayBar.push(objBar);
            arrayAnim.push(anmBar);
            nDelay += this.nDrawSec / dataLabel.length;

            if (cData.viewPopText || 0 == 1) {
                if ((this.nReverseXY || 0) == 1) {
                    if (nIdx == 0) {
                        var nTextPosition = this.nPaddingLeft + nPixelUnit * cData.data[i] * 0.5;
                    } else {
                        var nTextPosition = arrayPosX[i + ((nIdx - 1) * nLabelMax)] + nPixelUnit * cData.data[i] * 0.5;
                    };

                    var nBoxMargin = 10;

                    var sViewText = "[" + cData.name + "] " + dataLabel[i] + " : " + cData.data[i] + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                    var obj = cData.etc_data[nIdx];
                    for (var key in obj) {
                        if (key != "fnClick") {
                            sViewText += "\n" + key;
                            sViewText += " : " + obj[key];
                        }
                    }
                    var text = this.text(nTextPosition, arrayPosY[i] - 7, sViewText).attr({
                        font: cData.fontPopText || "bold 9pt 맑은 고딕",
                        fill: (cData.colorPopText || this.sPopTextColor) || "#FFFFFF"
                    }).hide();
                    var nTextWidth = text.getBBox().width;
                    var nTextHeight = text.getBBox().height;
                    text.translate(0, -(nTextHeight / 2));

                    var pop = this.rect(nTextPosition - nTextWidth / 2 - nBoxMargin / 2, arrayPosY[i] - 10 - nTextHeight, nTextWidth + nBoxMargin, 8 - nTextHeight).attr({
                        fill: cData.colorPopFill || cData.color,
                        stroke: cData.colorPopStroke || "#404040",
                        "stroke-width": cData.widthPopStroke || 2,
                        "fill-opacity": .8,
                        "r": 3
                    }).hide();

                } else {
                    var sViewText = "[" + cData.name + "] " + dataLabel[i] + " : " + cData.data[i] + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                    var obj = cData.etc_data[nIdx];
                    for (var key in obj) {
                        if (key != "fnClick") {
                            sViewText += "\n" + key;
                            sViewText += " : " + obj[key];
                        }
                    }
                    var text = this.text(nPosX, nPosY - 7, sViewText).attr({
                        font: cData.fontPopText || "bold 9pt 맑은 고딕",
                        fill: (cData.colorPopText || this.sPopTextColor) || "#FFFFFF"
                    }).hide();
                    var nTextWidth = text.getBBox().width;
                    var nTextHeight = text.getBBox().height;
                    text.translate(0, -(nTextHeight / 2));

                    var nBoxMargin = 10;
                    var nBoxPosition = nPosX - nTextWidth / 2 + nWidthBar / 2 - nBoxMargin / 2;

                    while (parseFloat(nBoxPosition) + parseFloat(nTextWidth) + parseFloat(nBoxMargin) >= parseFloat(this.width)) {
                        nBoxPosition -= 20;
                    };

                    var pop = this.rect(nBoxPosition, nPosY - 10 - nTextHeight, nTextWidth + nBoxMargin, 8 + nTextHeight).attr({
                        fill: cData.colorPopFill || cData.color,
                        stroke: cData.colorPopStroke || "#404040",
                        "stroke-width": cData.widthPopStroke || 2,
                        "fill-opacity": .8,
                        "r": 3
                    }).hide();

                    text.attr({ x: nBoxPosition + pop.getBBox().width / 2 });

                };
                pop_text.push(text);
                pop_box.push(pop)

                var rect = blanket[blanket.length - 1];
                (function (objBar, pop_box, pop_text, cData, nIdx) {
                    var i = 0;
                    rect.hover(function() {
                        objBar.attr({
                            fill: cData.colorHL || cData.color
                        });
                        this.attr({ "cursor": "pointer" });

                        pop_box.show();
                        pop_text.show();

                        pop_box.toFront();
                        pop_text.toFront();
                    }, function() {
                        objBar.attr({
                            fill: cData.color
                        });

                        pop_box.hide();
                        pop_text.hide();
                    });
                    rect.click(function () {
                        if (cData.etc_data[nIdx].fnClick != undefined)
                            eval(cData.etc_data[nIdx].fnClick);
                    });
                })(objBar, pop_box[i + (nIdx * nLabelMax)], pop_text[i + (nIdx * nLabelMax)], cData, nIdx);
            };
        };

        if ((this.sLegendDisplay || 0) > 0) {
            this.classLegend.jsonLegendKey.push({ "sType": this.shapeRect(), "sText": cData.name, "sAreaColor": cData.color, "sTxtColor": this.sDefaultTxtColor || "#FFFFFF" });
        };
    };

    blanket.toFront();

    for (nIdx = 0; nIdx < arrayBar.length; nIdx++) {
        arrayBar[nIdx].animate(arrayAnim[nIdx]);
    };
}


Raphael.fn.drawSideBarChart = function(nIdxBar, cData) {

    var nBarGap = this.nBarGap || 1 / (this.dataSideBar.length + 1);

    (nBarGap > 0.9 || nBarGap < 0.1) ? nBarGap = 0.1 : nBarGap = nBarGap || 1 / (this.dataSideBar.length + 1);

    var blanket = this.set();   // POP UP 처리를 하기위한 영역
    var pop_box = this.set();   // POP_UP 영역
    var pop_text = this.set();  // POP_UP TEXT

    var nCountBar = this.dataSideBar.length;
    if (this.dataStackBar.length > 0) { nCountBar++; }

    var nWidthBar = this.nPixelLabelX * (1 - nBarGap) / nCountBar;

    if ((this.nReverseXY || 0) == 1) {
        nWidthBar = (this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY / nCountBar * (1 - nBarGap);
    };

    var arrayBar = [];
    var arrayAnim = [];

    if ((this.nReverseXY || 0) == 1) {
        var dataLabel = this.sLabelYLeft;
    } else {
        var dataLabel = this.sXAxisLabel;
    };

    if (cData.baseYAxis == 1) {
        var nPixelUnit = this.nPixelUnitY_Left;
        var nPixelMin = this.minY_Left;
    } else {
        var nPixelUnit = this.nPixelUnitY_Right;
        var nPixelMin = this.minY_Right;
    };

    var nDelay = this.nDrawSec / dataLabel.length;

    for (var nIdx = 0; nIdx < dataLabel.length; nIdx++) {
        var nDataValue = cData.data[nIdx] || 0;
        var sDataValue = (this.sYAxisLeftFormatNumber || 0 == 1) ? input_comma_Number(nDataValue) : nDataValue;

        if ((this.nReverseXY || 0) == 1) {
            var nPosY = this.nPaddingTop + ((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY) * (nIdx + .5) - (nWidthBar / 2 * nCountBar) + nWidthBar * nIdxBar;
            var nPosX = this.nPaddingLeft + (nPixelUnit * nDataValue);

            var objBar = this.rect(this.nPaddingLeft + 1, nPosY, 0, nWidthBar).attr({
                fill: cData.color
				, stroke: cData.colorStroke || cData.color
				, "stroke-width": cData.strokeWidth || .5
            });

            var anmBar = Raphael.animation({ width: nPixelUnit * nDataValue }, this.nDrawSec);
            blanket.push(this.rect(this.nPaddingLeft, nPosY, nPixelUnit * nDataValue, nWidthBar).attr({ stroke: "none", fill: "#FFFFFF", opacity: 0 }));

        } else {
            var nPosX = this.nPaddingLeft + this.nPixelLabelX * (nIdx + .5) - (nWidthBar / 2 * nCountBar) + nWidthBar * nIdxBar;
            var nPosY = this.height - this.nPaddingBottom - nPixelUnit * nDataValue + (nPixelMin * nPixelUnit);

            var objBar = this.rect(nPosX, this.height - this.nPaddingBottom, nWidthBar, 0).attr({
                fill: cData.color
				, stroke: cData.colorStroke || cData.color
				, "stroke-width": cData.strokeWidth || .5
            });

            var anmBar = Raphael.animation({ y: nPosY + 1, height: nPixelUnit * nDataValue - (nPixelMin * nPixelUnit) }, this.nDrawSec);
            blanket.push(this.rect(nPosX, nPosY, nWidthBar, nPixelUnit * nDataValue).attr({ stroke: "none", fill: "#FFFFFF", opacity: 0 }));
        };

        arrayBar.push(objBar);
        arrayAnim.push(anmBar);

        nDelay += this.nDrawSec / dataLabel.length;

        if (cData.viewUpperText || 0 == 1) {
            if ((this.nReverseXY || 0) == 1) {
                var nPosX_Start = this.width - this.nPaddingRight;
                var upperText = cData.upperTextSideBar[nIdx] || parseFloat(nDataValue) + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                var bar_text = this.text(nPosX_Start, nPosY + nWidthBar / 2, upperText).attr({
                    font: cData.upperTextFont || "bold 10pt 맑은 고딕",
                    fill: (cData.upperTextColor || cData.color) || "#000000",
                    opacity: 0.2
                }).toFront();

                this.txtFront.push(bar_text);


                if (cData.nUpperTextPosion || 0 == 1) {
                    var nPosX_label = nPosX - (bar_text.getBBox().width / 2) - 3;
                } else {
                    var nPosX_label = nPosX + (bar_text.getBBox().width / 2) + 3;
                };

                if (nPosX_label - bar_text.getBBox().width / 2 < this.nPaddingLeft) {
                    nPosX_label = this.nPaddingLeft + bar_text.getBBox().width / 2 + 3;
                };

                bar_text.animate({
                    opacity: 1,
                    x: nPosX_label
                }, this.nDrawSec, "<");


            } else {
                var nPosY_Start = this.nPaddingTop;
                var upperText = cData.upperTextSideBar[nIdx] || parseFloat(nDataValue) + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                var bar_text = this.text(nPosX + nWidthBar / 2, nPosY_Start, upperText).attr({
                    font: cData.upperTextFont || "bold 10pt 맑은 고딕",
                    fill: (cData.upperTextColor || cData.color) || "#000000",
                    opacity: 0.2
                }).toFront();

                this.txtFront.push(bar_text);

                if (cData.nUpperTextPosion || 0 == 1) {
                    var nPosY_label = nPosY + bar_text.getBBox().height * 0.5;
                } else {
                    var nPosY_label = nPosY - bar_text.getBBox().height * 0.5;
                };

                bar_text.animate({
                    opacity: 1,
                    y: nPosY_label
                }, this.nDrawSec, "<");
            };
        }

        if (cData.viewPopText || 0 == 1) {
            if ((this.nReverseXY || 0) == 1) {
                var nPosX_Text = this.nPaddingLeft + nPixelUnit * nDataValue * 0.5;
                var sViewText = "[" + cData.name + "] " + dataLabel[nIdx] + " : " + sDataValue + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                var obj = cData.etc_data[nIdx];
                for (var key in obj) {
                    if (key != "fnClick") {
                        sViewText += "\n" + key;
                        sViewText += " : " + obj[key];
                    }
                }
                var text = this.text(nPosX_Text, nPosY - 7, sViewText).attr({
                    font: cData.fontPopText || "bold 10pt 맑은 고딕",
                    fill: (cData.colorPopText || this.sPopTextColor) || "#FFFFFF"
                }).hide();
                var nTextWidth = text.getBBox().width;
                var nTextHeight = text.getBBox().height;
                text.translate(0, -(nTextHeight / 2));

                var nBoxMargin = 10;
                var nPosX_Box = this.nPaddingLeft + nPixelUnit * nDataValue * 0.5 - nBoxMargin / 2;
                var pop = this.rect(nPosX_Box - nTextWidth / 2, nPosY - 10 - nTextHeight, nTextWidth + nBoxMargin, 8 + nTextHeight).attr({
                    fill: cData.colorPopFill || cData.color,
                    stroke: cData.colorPopStroke || "#404040",
                    "stroke-width": cData.widthPopStroke || 2,
                    "fill-opacity": .8,
                    "r": 3
                }).hide();

            } else {
                var sViewText = "[" + cData.name + "] " + dataLabel[nIdx] + " : " + sDataValue + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));

                var obj = cData.etc_data[nIdx];
                for (var key in obj) {
                    if (key != "fnClick") {
                        sViewText += "\n" + key;
                        sViewText += " : " + obj[key];
                    }
                }
                var text = this.text(nPosX, nPosY - 7, sViewText).attr({
                    font: cData.fontPopText || "bold 10pt 맑은 고딕",
                    fill: (cData.colorPopText || this.sPopTextColor) || "#FFFFFF"
                }).hide();
                var nTextWidth = text.getBBox().width;
                var nTextHeight = text.getBBox().height;
                text.translate(0, -(nTextHeight / 2));

                var nBoxMargin = 10;
                var nBoxPosition = nPosX - nTextWidth / 2 + nWidthBar / 2 - nBoxMargin / 2;

                while (parseFloat(nBoxPosition) + parseFloat(nTextWidth) + parseFloat(nBoxMargin) >= parseFloat(this.width)) {
                    nBoxPosition -= 20;
                };

                var pop = this.rect(nBoxPosition, nPosY - 10 - nTextHeight, nTextWidth + nBoxMargin, 8 + nTextHeight).attr({
                    fill: cData.colorPopFill || cData.color,
                    stroke: cData.colorPopStroke || "#404040",
                    "stroke-width": cData.widthPopStroke || 2,
                    "fill-opacity": .8,
                    "r": 3
                }).hide();

                text.attr({ x: nBoxPosition + pop.getBBox().width / 2 });

            };

            pop_text.push(text);
            pop_box.push(pop)

            var rect = blanket[blanket.length - 1];
            (function (objBar, pop_box, pop_text, nIdx) {
                var i = 0;
                rect.hover(function() {
                    objBar.attr({
                        fill: cData.colorHL || cData.color
                    });
                    this.attr({ "cursor": "pointer" });

                    pop_box.show();
                    pop_text.show();

                    pop_box.toFront();
                    pop_text.toFront();

                }, function() {
                    objBar.attr({
                        fill: cData.color
                    });

                    pop_box.hide();
                    pop_text.hide();
                });
                rect.click(function () {
                    if (cData.etc_data[nIdx].fnClick != undefined)
                        eval(cData.etc_data[nIdx].fnClick);
                });
            })(objBar, pop_box[nIdx], pop_text[nIdx], nIdx);
        };
    };

    blanket.toFront();


    for (nIdx = 0; nIdx < arrayBar.length; nIdx++) {
        arrayBar[nIdx].animate(arrayAnim[nIdx]);
    };
};



Raphael.fn.drawLineChart = function(nIdxLine, cData) {

    var blanket = this.set();    // POP UP 처리를 하기위한 영역(dot로 하면 너무 작아서 별도의 영역을 생성)
    var pop_box = this.set();    // POP_UP 영역
    var pop_text = this.set();    // POP_UP TEXT

    var arrayLine = [];
    var arrayAnim_L = [];

    var arrayDot = [];
    var arrayAnim_D = [];

    if ((this.nReverseXY || 0) == 1) {
        var dataLabel = this.sLabelYLeft;
    } else {
        var dataLabel = this.sXAxisLabel;
    };

    var nDelay = this.nDrawSec / dataLabel.length;

    if (cData.baseYAxis == 1) {
        var nPixelUnit = this.nPixelUnitY_Left;
        var nPixelMin = this.minY_Left;
    } else {
        var nPixelUnit = this.nPixelUnitY_Right;
        var nPixelMin = this.minY_Right;
    };

    var bViewZero = this.dataLine[nIdxLine].viewZero;
    for (var nIdx = 0; nIdx < dataLabel.length; nIdx++) {
        if ((this.nReverseXY || 0) == 1) {
            var nPosY = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx + .5) + this.nPaddingTop);
            var nPosX = this.nPaddingLeft + nPixelUnit * cData.data[nIdx];

            var nPosY_next = Math.round((this.height - this.nPaddingTop - this.nPaddingBottom) / this.nY * (nIdx + 1.5) + this.nPaddingTop);
            var nPosX_next = this.nPaddingLeft + nPixelUnit * cData.data[nIdx + 1]

            if (bViewZero || cData.data[nIdx] > 0)
                var dot = this.circle(nPosX + 1, nPosY, cData.sizeDot || 3).attr({ fill: cData.color, "fill-opacity": 0, stroke: cData.color, "stroke-width": 0, "stroke-opacity": .4 });
            else
                var dot = this.circle(nPosX + 1, nPosY, cData.sizeDot || 3).attr({ opacity: 0 });
            arrayAnim_D.push(Raphael.animation({ "fill-opacity": 1, "stroke-width": cData.widthStroke || 5 }, this.nDrawSec / dataLabel.length));
            arrayDot.push(dot);

        } else {
            var nPosX = this.nPaddingLeft + this.nPixelLabelX * (nIdx + .5) - 1;
            var nPosY = this.height - this.nPaddingBottom - nPixelUnit * cData.data[nIdx] + (nPixelMin * nPixelUnit);

            var nPosX_next = this.nPaddingLeft + this.nPixelLabelX * (nIdx + 1.5) - 1;
            var nPosY_next = this.height - this.nPaddingBottom - nPixelUnit * cData.data[nIdx + 1] + (nPixelMin * nPixelUnit);

            //var nPosX_pre = this.nPaddingLeft + this.nPixelLabelX * (nIdx - .5) - 1;
            //var nPosY_pre = this.height - this.nPaddingBottom - nPixelUnit * cData.data[nIdx - 1] + (nPixelMin * nPixelUnit);
            
            if (bViewZero || cData.data[nIdx] > 0)
                var dot = this.circle(nPosX + 1, nPosY, cData.sizeDot || 3).attr({ fill: cData.color, "fill-opacity": 0, stroke: cData.color, "stroke-width": 0, "stroke-opacity": .4 });
            else
                var dot = this.circle(nPosX + 1, nPosY, cData.sizeDot || 3).attr({opacity: 0});
            arrayAnim_D.push(Raphael.animation({ "fill-opacity": 1, "stroke-width": cData.widthStroke || 5 }, this.nDrawSec / dataLabel.length));
            arrayDot.push(dot);
        };
            
        if (nIdx < dataLabel.length - 1) {
            //ePath = "M" + nPosX + "," + nPosY + "L" + nPosX_next + "," + nPosY_next;
            ePath = "M" + nPosX + "," + nPosY + "L" + nPosX_next + "," + nPosY_next;
            sPath = "M" + nPosX + "," + nPosY;

            arrayAnim_L.push(Raphael.animation({ path: ePath }, this.nDrawSec / dataLabel.length));
            if (bViewZero || (cData.data[nIdx] > 0 && cData.data[nIdx + 1] > 0))
                arrayLine.push(this.path(sPath).attr({ stroke: cData.color, "stroke-width": cData.thickness, "stroke-linejoin": "round" }));
            else
                arrayLine.push(this.path(sPath).attr({ opacity: 0 }));
        }

        nDelay += this.nDrawSec / dataLabel.length;

        blanket.push(this.rect(nPosX - 8, nPosY - 8, 16, 16).attr({ stroke: "none", fill: "#fff", opacity: 0 }));

        var sViewText = "[" + cData.name + "] " + dataLabel[nIdx] + " : " + cData.data[nIdx] + ((cData.baseYAxis == 1) ? (this.sYAxisLeftLabelUnit || "") : (this.sYAxisRightLabelUnit || ""));
        var fnClick;
        var obj = cData.etc_data[nIdx];
        for (var key in obj) {
            if (key != "fnClick") {
                sViewText += "\n" + key;
                sViewText += " : " + obj[key];
            } else
                fnClick = obj[key];
        }

        var text = this.text(nPosX, nPosY - 15, sViewText).attr({
            font: cData.fontPopText || "bold 10pt 맑은 고딕",
            fill: (cData.colorPopText || this.sPopTextColor) || "#FFFFFF"
        }).hide();
        var nTextWidth = text.getBBox().width;
        var nTextHeight = text.getBBox().height;
        text.translate(0, -(nTextHeight / 2));
        pop_text.push(text);

        var pop = this.rect(nPosX - nTextWidth / 2 - 5, nPosY - 18 - nTextHeight, nTextWidth + 10, 8 + nTextHeight).attr({
            fill: cData.colorPopFill || cData.color,
            stroke: cData.colorPopStroke || "#404040",
            "stroke-width": cData.widthPopStroke || 2,
            "fill-opacity": .8,
            "r": 3
        }).hide();
        pop_box.push(pop);

        var rect = blanket[blanket.length - 1];
        (function(dot, pop_box, pop_text, nIdx) {
            var i = 0;
            rect.hover(function () {
                dot.attr("r", cData.sizeHL || 6);
                this.attr({ "cursor": "pointer" });

                pop_box.show();
                pop_box.toFront();

                pop_text.show();
                pop_text.toFront();

            }, function () {
                dot.attr("r", cData.sizeDot || 3);

                pop_box.hide();
                pop_text.hide();
            });
            rect.click(function () {
                if (cData.etc_data[nIdx].fnClick != undefined)
                    eval(cData.etc_data[nIdx].fnClick);
            });
        })(dot, pop_box[nIdx], pop_text[nIdx], nIdx);
    }

    blanket.toFront();

    for (nIdx = 0; nIdx < arrayLine.length; nIdx++) {
        anim_L = Raphael.animation(arrayAnim_L[nIdx]);
        arrayLine[nIdx].animate(anim_L.delay(this.nDrawSec / dataLabel.length * (nIdx + 1)));
    }

    for (nIdx = 0; nIdx < arrayDot.length; nIdx++) {
        anim_D = Raphael.animation(arrayAnim_D[nIdx]);
        arrayDot[nIdx].animate(anim_D.delay(this.nDrawSec / dataLabel.length * (nIdx + 1)));
    }

};


Raphael.fn.drawPieChart = function(nPie, cData) {

    var paper = this;
    var rad = Math.PI / 180;
    var chart = this.set();
    var nDrawSec = this.nDrawSec;
    var label = this.set();

    var cx = this.nPaddingLeft + (this.width - this.nPaddingLeft - this.nPaddingRight) / (this.dataPie.length) * (nPie + .5);
    var cy = (this.height - this.nPaddingTop - this.nPaddingBottom) / 2 + this.nPaddingTop;
    var r = cData.radius || Math.min((this.width - this.nPaddingLeft - this.nPaddingRight) / (this.dataPie.length) * .35, (this.height - this.nPaddingTop - this.nPaddingBottom) * .35);

    var arrayColor = ["#268F81", "#804CD9", "#FF8E46", "#FFEA00", "#FF7E00", "#33BAFF", "#8BBA00", "#F6BD0F", "#FF2DA4", "#FFC519", "#90D133", "#D64646", "#8E468E", "#588526", "#B3AA00", "#008ED6", "#9D080D", "#A186BE", "#DC4522", "#AFD8F8", "#F6BD0F", "#8BBA00", "#FF8E46", "#D64646", "#8E468E", "#588526", "#B3AA00", "#008ED6", "#9D080D", "#A186BE", "#DC4522", "#FF7E00", "#FFC519", "#90D133", "#FFEA00", "#268F81", "#33BAFF", "#804CD9", "#FF2DA4"]

    var nDelay = nDrawSec / cData.data.length;

    function sector(cx, cy, r, startAngle, endAngle, params) {
        var x1 = cx + r * Math.cos(-startAngle * rad);
        var x2 = cx + r * Math.cos(-endAngle * rad);
        var y1 = cy + r * Math.sin(-startAngle * rad);
        var y2 = cy + r * Math.sin(-endAngle * rad);

        var sPath = "M" + cx + "," + cy + "L" + x1 + "," + y1 + "A" + r + "," + r + "," + 0 + "," + +(endAngle - startAngle > 180) + "," + 0 + "," + x2 + "," + y2 + "Z";
        //var objPath = paper.path(["M", cx, cy, "L", x1, y1]).attr(params);
        var objPath = paper.path(["M", cx, cy]).attr(params);
        objPath.animate(Raphael.animation({ path: sPath }, nDrawSec / cData.data.length, "backOut").delay(nDelay));

        nDelay += nDrawSec / cData.data.length;

        return objPath;
    }

    var angle = 0;
    var total = 0;
    var delta = cData.labelPosition || 0;

    cx += cData.moveX || 0;
    cy += cData.moveY || 0;

    var text = this.text(cx, 0, "[" + cData.name + "]").attr({ font: cData.fontTitle || "bold 10pt 맑은 고딕", fill: cData.colorTitle || "#000000" }).hide();

    switch (cData.nTitlePosition || 0) {
        case 0:
            {
                //text.attr({ y: this.nPaddingTop + text.getBBox().height }).show();
                text.attr({ y: cy - r - text.getBBox().height }).show();
                cy += text.getBBox().height / 2;
                break;
            }
        case 1:
            {
                //text.attr({ y: this.height - this.nPaddingBottom - text.getBBox().height }).show();
                text.attr({ y: cy + r + text.getBBox().height }).show();
                cy -= text.getBBox().height * 1.5;
                break;
            }
        case 2:
            {
                text.attr({ y: cy }).show();
                break;
            }
    }

    //DrawArea에서 나가지 못하도록
    (cx - r < this.nPaddingLeft + 5) ? cx = r + this.nPaddingLeft + 5 : cx = cx;
    (cx + r > this.width - this.nPaddingRight - 5) ? cx = this.width - r - this.nPaddingRight - 5 : cx = cx;

    (cy - r < this.nPaddingTop + 5) ? cy = r + this.nPaddingTop + 5 : cy = cy;
    (cy + r > this.height - this.nPaddingBottom + 5) ? cy = this.height - r - this.nPaddingBottom - 5 : cy = cy;

    process = function(j) {
        var value = cData.data[j];
        var angleplus = 360 * value / total;
        var popangle = angle + (angleplus / 2);
        var bgColor;
        (j < arrayColor.length - 1) ? bgColor = arrayColor[j] : bgColor = arrayColor[j - arrayColor.length];

        var p = sector(cx, cy, r, angle, angle + angleplus, { fill: arrayColor[j], stroke: cData.colorStroke || arrayColor[j], "stroke-width": cData.strokeWidth || 1.5 });
        var sLabel = cData.labelText || "";

        if (cData.percent == 1) {
            var sValue = cData.labels[j] + " : " + (value / total * 100).toFixed(cData.percentDecimal) + "%";
        } else {
            var sValue = cData.labels[j] + " : " + value + sLabel;
        }
        var text = paper.text(cx + (r + delta) * Math.cos(-popangle * rad), cy + (r + delta) * Math.sin(-popangle * rad), sValue).attr({
            font: cData.labelFont || "bold 10pt 맑은 고딕",
            fill: cData.labelColor || "#000000",
            opacity: cData.viewLabel || 0
        });

        label.push(text);

        var text_etc = "";
        var obj = cData.etc_data[j];
        var fnClick;
        for (var key in obj) {
            if (key != "fnClick") {
                text_etc += "\n" + key;
                text_etc += " : " + obj[key];
            } else
                fnClick = obj[key];
        }
        text_etc = text_etc.replace(2, text_etc.length);

        var text_etc = paper.text(cx, cy, text_etc).attr({
            font: cData.labelFont || "bold 10pt 맑은 고딕",
            fill: cData.labelColor || "#000000",
            opacity: cData.viewLabel || 0
        });
        var nTextHeight = text_etc.getBBox().height;
        text_etc.translate(0, -(nTextHeight / 2));

        //labelRadius

        p.mouseover(function () {
            this.attr({ "cursor": "pointer" });
            p.stop().animate({ transform: "s1.1 1.1 " + cx + " " + cy }, 300, "elastic");
            if (!cData.viewLabel || false) {
                text.stop().animate({ opacity: 1 }, 300);
                text_etc.toFront().stop().animate({ opacity: 1 }, 300);
            }
        }).mouseout(function() {
            p.stop().animate({ transform: "" }, 300);
            if (!cData.viewLabel || false) {
                text.stop().animate({ opacity: 0 }, 300);
                text_etc.stop().animate({ opacity: 0 }, 300);
            }
        });
        p.click(function () {
            if (fnClick != undefined)
                eval(fnClick);
        });

        text.mouseover(function () {
            this.attr({ "cursor": "pointer" });
            p.stop().animate({ transform: "s1.1 1.1 " + cx + " " + cy }, 300, "elastic");
            if (!cData.viewLabel || false) {
                text.stop().animate({ opacity: 1 }, 300);
                text_etc.toFront().stop().animate({ opacity: 1 }, 300);
            }
        }).mouseout(function() {
            p.stop().animate({ transform: "" }, 300);
            if (!cData.viewLabel || false) {
                text.stop().animate({ opacity: 0 }, 300);
                text_etc.stop().animate({ opacity: 0 }, 300);
            }
        });
        text.click(function () {
            if (fnClick != undefined)
                eval(fnClick);
        });

        angle += angleplus;
    };

    for (var i = 0; i < cData.data.length; i++) {
        total += cData.data[i];
    }

    for (i = 0; i < cData.data.length; i++) {
        process(i);
    }

    text.toFront();
    label.toFront();

    return chart;
};