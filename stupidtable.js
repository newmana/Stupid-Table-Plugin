// Stupid jQuery table plugin.

// Call on a table
// sortFns: Sort functions for your datatypes.
(function ($) {
    $.fn.stupidtable = function (sortFns) {
        var $table = $(this);
        // Merge sort functions with some default sort functions.
        sortFns = sortFns || {};
        sortFns = $.extend({}, {
            "int" : function (a, b) {
                return parseInt(a, 10) - parseInt(b, 10);
            },
            "float" : function (a, b) {
                return parseFloat(a) - parseFloat(b);
            },
            "string" : function (a, b) {
                if (a < b) return -1;
                if (a > b) return +1;
                return 0;
            }
        }, sortFns);

        $.fn.stupidtable.sortFns = $.extend({}, $.fn.stupidtable.sortFns, sortFns);

        // Do sorting when THs are clicked
        $table.on("click", "th", function () {
            $.fn.stupidtable.sortColumn($table, $(this).index());
        });
    };

    $.fn.stupidtable.sortColumn = function (table, index) {
        var sort_map = function (arr, sort_function) {
            var sorted = arr.slice(0).sort(sort_function);
            var map = [];
            var index = 0;
            for (var i = 0; i < arr.length; i++) {
                index = $.inArray(arr[i], sorted);

                // If this index is already in the map, look for the next index.
                // This handles the case of duplicate entries.
                while ($.inArray(index, map) != -1) {
                    index++;
                }
                map.push(index);
            }
            return map;
        };

        var apply_sort_map = function (arr, map) {
            var clone = arr.slice(0);
            var newIndex = 0;
            for (var i = 0; i < map.length; i++) {
                newIndex = map[i];
                clone[newIndex] = arr[i];
            }
            return clone;
        };

        var selected_col = 0;
        $(table).find('th').slice(0, index).each(function () {
            var cols = $(this).attr('colspan') || 1;
            selected_col += parseInt(cols, 10);
        });

        var trs = $(table).find("tbody tr");
        var classes = $($(table).find('th')[index]).attr("class");
        var type = null;
        if (classes) {
            classes = classes.split(/\s+/);
            for (var j = 0; j < classes.length; j++) {
                if (classes[j].search("type-") != -1) {
                    type = classes[j];
                    break;
                }
            }
            if (type) {
                type = type.split('-')[1];
            }
            else {
                type = "string";
            }
        }

        var heading = $(table).find('tr th')[index] || null;
        // Don't attempt to sort if no data type
        if (type === null || heading === null) {
            return false;
        }
        var sort_dir = $.data(heading, "sort-dir") === "desc" ? "asc" : "desc";
        var sortMethod = $.fn.stupidtable.sortFns[type];

        setTimeout(function () {
            // Gather the elements for this column
            var column = [];

            // Push either the value of the 'data-order-by' attribute if specified
            // or just the text() value in this column to column[] for comparison.
            trs.each(function (index, tr) {
                var $e = $(tr).children().eq(selected_col);
                var sort_val = $e.data("sort-value");
                var order_by = typeof(sort_val) !== "undefined" ? sort_val : $e.text();
                column.push(order_by);
            });

            // If the column is already sorted, just reverse the order. The sort
            // map is just reversing the indexes.
            var theMap = [];
            if ($.fn.stupidtable.is_sorted === selected_col) {
                column.reverse();
                for (var j = column.length - 1; j >= 0; j--) {
                    theMap.push(j);
                }
            }
            else {
                // Get a sort map and apply to all rows
                theMap = sort_map(column, sortMethod);
                $.fn.stupidtable.is_sorted = selected_col;
            }
            $(table).find("th").data("sort-dir", null).removeClass("sortdesc sortasc sortcol");
            $.data(heading, "sort-dir", sort_dir)
            $(heading).addClass("sortcol sort" + sort_dir);

            // Replace the content of tbody with the sortedTRs. Strangely (and
            // conveniently!) enough, .append accomplishes this for us.
            var sortedTRs = $(apply_sort_map(trs, theMap));
            $(table).children("tbody").append(sortedTRs);
            $(table).trigger("aftertablesort", {column : index, direction : sort_dir})
        }, 10);
    };

    $.fn.stupidtable.is_sorted = -1;
})(jQuery);