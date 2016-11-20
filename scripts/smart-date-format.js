Ext.define('Customization.override.Smartdate', {}, function () {
    var ExtDate = Ext.Date,
        config = Customization.util.Config.getConfiguration('smart-date-format'),
        smartDate = function (date, defaultFormat) {
            var today = ExtDate.clearTime(new Date()),
                dayDiff = ExtDate.diff(today.getTime(), date.getTime(), ExtDate.DAY),
                dayDiffAbs = Math.abs(dayDiff),
                defaultTime = ExtDate.defaultFormats.timeStr,
                addTime = defaultFormat === ExtDate.defaultFormats.datetime || defaultFormat === defaultTime,
                disabled = config.disabled && config.disabled === 'true',
                daysLimit = Ext.Number.from(config.daysLimit, 5),
                formatted;

            if (disabled || dayDiffAbs > daysLimit) {
                return ExtDate.format(date, defaultFormat || ExtDate.defaultFormat);
            }

            if (dayDiff === 0) {
                formatted = 'today';
            } else if (dayDiff === -1) {
                formatted = 'yesterday';
            } else if (dayDiff === 1) {
                formatted = 'tomorrow';
            } else if (dayDiffAbs < 6) {
                formatted = dayDiff < 0 ? dayDiffAbs + ' days ago' : 'in ' + dayDiffAbs + ' days';
            } else if (Math.abs(dayDiff) < 31) {
                var ms1 = today.getTime(),
                    ms2 = date.getTime(),
                    weekDiff = Math.floor((ms2 - ms1) / ExtDate.ONE_WEEK),
                    weekDiffAbs = Math.abs(weekDiff);
                addTime = false;
                if (weekDiff < 0) {
                    formatted = weekDiffAbs === 1 ? 'last week' : weekDiffAbs + ' weeks ago';
                } else {
                    formatted = weekDiffAbs === 1 ? 'next week' : 'in ' + weekDiffAbs + ' weeks';
                }
            } else {
                return ExtDate.format(date, defaultFormat || ExtDate.defaultFormat);
            }
            if (addTime) {
                formatted += ' @ ' + ExtDate.format(date, defaultTime);
            }
            return '<span data-qtip="' + ExtDate.format(date, ExtDate.defaultFormats.datetime) + '">' + formatted + '</span>';
        };

    ExtDate.formatFunctions.smart = ExtDate.smartDate = smartDate;
});

Ext.define('Customization.view.smartdate.Configurator', {
    extend: 'Customization.view.Configurator',

    viewModel: {
        data: {
            disabled:  false,
            daysLimit: null
        }
    },

    layout: {
        type:  'vbox',
        align: 'stretchmax'
    },
    items:  [{
        xtype:      'checkbox',
        name:       'disableSmartDate',
        fieldLabel: 'Disable Smart Date Formatting',
        labelWidth: 200,
        bind:       {
            value: '{disabled}'
        }
    }, {
        xtype:      'numberfield',
        name:       'daysLimit',
        fieldLabel: 'Formatting Threshold (days)',
        labelWidth: 200,
        minValue:   0,
        maxValue:   31,
        bind:       {
            disabled: '{disabled}',
            value:    '{daysLimit}'
        }
    }]
});
