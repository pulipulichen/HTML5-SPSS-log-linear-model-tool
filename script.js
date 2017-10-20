
// -----------------------

var _download_file = function (data, filename, type) {
    var a = document.createElement("a"),
        file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }

}
// ----------------------------

var _copy_table = function () {
	var _button = $(this);
	
	var _table = $($(this).data("copy-table"));
	var _tr_coll = _table.find("tr");
	
	var _text = "";
	for (var _r = 0; _r < _tr_coll.length; _r++) {
		if (_r > 0) {
			_text = _text + "\n";
		}
		
		var _tr = _tr_coll.eq(_r);
		var _td_coll = _tr.find("td");
		if (_td_coll.length === 0) {
			_td_coll = _tr.find("th");
		}
		for (var _c = 0; _c < _td_coll.length; _c++) {
			var _td = _td_coll.eq(_c);
			var _value = _td.text();
			
			if (_c > 0) {
				_text = _text + "\t";
			}
			_text = _text + _value.trim();
		}
	}
	
	_copy_to_clipboard(_text);
};

var _copy_csv_table = function () {
	var _button = $(this);
	
	var _text = $("#preview").val().replace(/,/g , "\t");
	
	_copy_to_clipboard(_text);
};

_copy_field = function () {
	//console.log(1);
	//var _button = $(this);
	//console.log(_button.length);
	var _text = $($(this).data("copy-field")).val();
	//console.log($(this).data("copy-field"));
	
	_copy_to_clipboard(_text);
};

var _copy_to_clipboard = function(_content) {
	//console.log(_content);
	var _button = $('<button type="button" id="clipboard_button"></button>')
		.attr("data-clipboard-text", _content)
		.hide()
		.appendTo("body");
		
	var clipboard = new Clipboard('#clipboard_button');
	
	_button.click();
	_button.remove();
};

// ----------------------------
var _vue_setup = function () {
return new Vue({
el: "#file_process_framework",
data: {
	input_mode_textarea: "e 1 2\nv 1 2\ni 1 4\nu 1 4",
	input_mode_model: "e*v*i e*i*u v*u",
	combinations: "",
	preview: "",
	odds_input: "2.0744",
	odds_output: "",
	//para_input: "-0.41 0.01 -0.36 ?\n? ? ? ?",	//2行類型
	//para_input: "0.682 0.732 0.433 ?\n0.780 0.365 0.371 ?\n? ? ? ?",	//3行類型
	para_input: "0.682 0.732 0.433 ?\n0.780 0.365 0.371 ?\n0.32 -0.11 0.192 ?\n? ? ? ?\n? ? ? ?\n? ? ? ?\n? ? ? ?\n? ? ? ?",	//8行類型
	para_output: ""
},	//data: {
methods: {
	reset: function () {
		this.combinations = "";
		this.preview = "";
	},
	set_input_mode_textarea_output: function () {
		var _variables = {};
		var _variables_list = [];
		var _lines = this.input_mode_textarea.split("\n");
		for (var _i = 0; _i < _lines.length; _i++) {
			var _line = _lines[_i].trim();
			if (_line === "") {
				continue;
			}
			
			var _fields = _line.split(" ");
			if (isNaN(_fields[2])) {
				return this.reset();
			}
			
			_variables[_fields[0]] = [parseInt(_fields[1], 10), parseInt(_fields[2], 10)];
			_variables_list.push(_fields[0]);
		}
		
		// ---------------------------------------
		
		var _combinations = "";
		/*
		for (var _i = 0; _i < _variables_list.length; _i++) {
			
			
			
			if (_i === _variables_list.length - 1) {
				_combination = _combination + "\n";
			}
		}*/
		var _get_combinations = function(_start, _end, _prefix_array) {
			var _array = [];
			
			if (_prefix_array === undefined) {
				for (var _i = _start; _i < _end+1; _i++) {
					_array.push(_i);
				}
			}
			else {
				for (var _j = 0; _j < _prefix_array.length; _j++) {
					var _prefix = _prefix_array[_j];
					for (var _i = _start; _i < _end+1; _i++) {
						_array.push(_prefix + "\t" + _i);
					}
				}
			}
			return _array;
		};
		
		var _prefix_array;
		for (var _i = 0; _i < _variables_list.length; _i++) {
			var _v = _variables_list[_i];
			var _start = parseInt(_variables[_v][0], 10);
			var _end = parseInt(_variables[_v][1], 10);
			//console.log(_variables[_v]);
			_prefix_array = _get_combinations(_start, _end, _prefix_array);
			//_combinations = _prefix_array;
			//break;
			
			if (_i === _variables_list.length -1) {
				_combinations = _prefix_array;
			}
		}
		
		this.combinations = _combinations.join("\n");
		
		// ---------------------------------------
		
/*
HILOGLINEAR e(1 2) v(1 2) i(1 4) u(1 4) 
                 /METHOD=BACKWARD
                 /PRINT=FREQ ASSOCIATION
                 /DESIGN.
*/
		var _cmd = "";
		
		var _h_var = [];
		for (var _v in _variables) {
			_h_var.push(_v + "(" + _variables[_v][0] + " " + _variables[_v][1] + ")");
		}
		
		_cmd = "HILOGLINEAR " + _h_var.join(" ") + " "
                + "\n\t\t/METHOD=BACKWARD"
                + "\n\t\t/PRINT=FREQ ASSOCIATION"
                + "\n\t\t/DESIGN.";
		
		// ------------------------------------------
/*
LOGLINEAR       e(1 2) v(1 2) i(1 4) u(1 4) 
                /PRINT=FREQ RESID ESTIM
                /DESIGN= e v i u e*i e*u e*v i*u i*v u*v e*v*i e*i*u .
*/
		var _design = [];
		if (this.input_mode_model.trim() !== "") {
		
			var _models = this.input_mode_model.split(" ");
			
			var _combine_factors = function(_factor, _prefix) {
				
				if (_prefix === undefined) {
					return [_factor];
				}
				else {
					var _array = [];
					for (var _i = 0; _i < _prefix.length; _i++) {
						_array.push(_prefix[_i] + "*" + _factor);
					}
					return _array;
				}
			};
			
			for (var _i = 0; _i < _models.length; _i++) {
				var _factors = _models[_i].split("*");
				
				//var _prefix = undefined;
				/*
				for (var _j = 0; _j < _factors.length; _j++) {
					_prefix = _combine_factors(_factors[_j], _prefix);
					
					for (var _k = 0; _k < _prefix.length; _k++) {
						var _p = _prefix[_k];
						if ($.inArray(_p, _design) === -1) {
							_design.push(_p);
						}
					}
				}
				*/
				var _array = unique_combination_of_array(_factors);
				for (var _k = 0; _k < _array.length; _k++) {
					var _p = _array[_k].join("*");
					if ($.inArray(_p, _design) === -1) {
						_design.push(_p);
					}
				}
			}
			
			_design.sort(function(a, b){
			  // ASC  -> a.length - b.length
			  // DESC -> b.length - a.length
			  return a.length - b.length;
			});
			
			
			//console.log(_design.join(" "));
			_cmd = _cmd + "\nLOGLINEAR " + _h_var.join(" ")
					+ "\n\t\t/PRINT=FREQ RESID ESTIM"
					+ "\n\t\t/DESIGN= " + _design.join(" ") + " .";
					
			// --------------------------------
			_cmd = _cmd + "\nGENLOG " + _variables_list.join(" ")
                + "\n\t\t/MODEL = MULTINOMIAL"
                + "\n\t\t/PRINT = FREQ RESID ADJRESID ZRESID ESTIM"
                + "\n\t\t/PLOT=NONE"
                + "\n\t\t/DESIGN= " + _design.join(" ") + " .";
			
					
		}	// if (this.input_mode_model.trim() !== "") {
			
		// ------------------------------------------
		
		this.preview = _cmd;
	},	// set_input_mode_textarea_output: function () {
	calc_odds: function () {
		if (isNaN(this.odds_input)) {
			this.odds_output = "";
			return;
		}
		var _input = parseFloat(this.odds_input, 10);
		this.odds_output = Math.pow(Math.E, _input);
	},
	calc_para: function () {
		if (this.para_input.trim() === "") {
			this.para_output = "";
			return;
		}
		
		var _data = [];
		var _lines = this.para_input.trim().split("\n");
		for (var _i = 0; _i < _lines.length; _i++) {
			var _row = _lines[_i].trim().split(" ");
			for (var _r = 0; _r < _row.length; _r++) {
				if (isNaN(_row[_r]) === false) {
					_row[_r] = parseFloat(_row[_r], 10);
				}
			}
			_data.push(_row);
		}
		
		// ----------------------------------------
		// 先算每一行的結尾
		for (var _r = 0; _r < _data.length; _r++) {
			var _row = _data[_r];
			if (_row[0] === "?") {
				break;
			}
			
			var _last = 0;
			for (var _c = 0; _c < _row.length-1; _c++) {
				_last = _last - _row[_c];
			}
			
			_data[_r][(_row.length-1)] = _last;
		}
		
		// ---------------------------------------
		// 判斷模式
		if (_data.length % 2 === 1 || _data.length === 2) {
			// 這樣只有最後一行會是?
			var _l = (_data.length-1)
			var _last_row = _data[_l];
			
			for (var _c = 0; _c < _last_row.length; _c++) {
				var _last = 0;
				
				for (var _r = 0; _r < _data.length-1; _r++) {
					_last = _last - _data[_r][_c];
				}
				
				_data[_l][_c] = _last;
			}
		}
		//else if (_data[(_data.length/2)-1][0] === "?") {
		else {
			// 還有另一半的類型
			var _len = _data.length;
			var _l = ((_data.length/2)-1)
			var _last_row = _data[_l];
			
			for (var _c = 0; _c < _last_row.length; _c++) {
				var _last = 0;
				
				for (var _r = 0; _r < _data.length-1; _r++) {
					if (isNaN(_data[_r][_c])) {
						break;
					}
					_last = _last - _data[_r][_c];
				}
				
				_data[_l][_c] = _last;
			}
			
			// ----------------------
			for (var _l = (_len/2); _l < _data.length; _l++) {
				var _mirror_row = _data[_l - (_len/2)];
				//console.log(_mirror_row);
				for (var _r = 0; _r < _mirror_row.length; _r++) {
					_data[_l][_r] = _mirror_row[_r]*-1;
				}
			}
			
		}
		
		// ---------------------------------------
		
		//console.log(_data);
		
		/*
		for (var _i = 0; _i < _data.length; _i++) {
			_data[_i] = _data[_i].join("\t");
		}
		this.para_output = _data.join("\n");
		*/
		var _table = $("#para_output tbody");
		for (var _i = 0; _i < _data.length; _i++) {
			_data[_i] = "<tr><td>" + _data[_i].join("</td><td>") + "</td></tr>";
		}
		_table.html(_data.join(""));
	}
}	// methods: {
});	//new Vue({
};	// var _vue_setup = function () {

function unique_combination_of_array(_array) {
    var _combination = [];
    
    var _length = _array.length;
    
    
    for (var _l = 1; _l < _length; _l++)
    {
        _combination = parse_combination(_array, _combination, _l);
    }
    _combination.push(_array);
    
    return _combination;
}

    
function parse_combination(_array, _output, _length, _length_pos, _length_ang)
{
    if (_length_pos == null)
        _length_pos = 1;
    if (_length_ang == null)
        _length_ang = [];
    
    //初始化的部份
    if (_length_ang.length < _length_pos)
    {
        if (_length_pos == 1)
        {
            _length_ang.push(1);
        }
        else
        {
            var _prev_index = _length_ang[(_length_ang.length-1)];
            _length_ang.push(_prev_index+1);
        }
    }
    
    var _index = 0;
    if (_length_pos > 1)
    {
        var _prev_index = _length_ang[(_length_pos-2)];
        _index = _prev_index+1;
    }
    
    if (_length_ang.length < _length_pos)
    {
        _length_ang.push(_index);
    }
    
    for (var _i = _index; _i < _array.length - (_length - _length_pos); _i++)
    {
        if (_length_ang.length > _length_pos)
        {
            //避免受到傳址影響，必須重整
            var _temp = [];
            for (var _p = 0; _p < _length_pos; _p++)
                _temp.push(_length_ang[_p]);
            _length_ang = _temp;
        }
        
        _length_ang[(_length_pos-1)] = _i;
        
        //如果抵達這個長度的話
        if (_length_ang.length == _length)
        {
            //輸出
            var _output_ang = [];
            for (var _a in _length_ang)
            {
                _index = _length_ang[_a];
                var _code = _array[_index];
                _output_ang.push(_code);
            }
            _output.push(_output_ang);
        }
        else    //如果尚未抵達這個長度
        {
            _output = parse_combination(_array, _output, _length, (_length_pos+1), _length_ang);
        }
    }
    
    return _output;
}

// -----------------------

$(function () {
  //var _panel = $(".file-process-framework");
  var _vue = _vue_setup();
  _vue.set_input_mode_textarea_output();
  _vue.calc_odds();
  _vue.calc_para();
  
  //console.log(_panel.find("button.copy-field").length);
  $("button.copy-field").click(_copy_field);
  $("button.copy-table").click(_copy_table);
});