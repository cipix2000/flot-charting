/* global $, describe, it, beforeEach, afterEach, expect, HistoryBuffer, setFixtures */
/* jshint browser: true*/
/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js*,../jquery.flot.js,../jquery.flot.charting.js */

describe('A Flot chart', function () {
    'use strict';

    var plot;
    var placeholder;

    beforeEach(function () {
        var fixture = setFixtures('<div id="demo-container" style="width: 800px;height: 600px">').find('#demo-container').get(0);
        placeholder = $('<div id="placeholder" style="width: 100%;height: 100%">');
        placeholder.appendTo(fixture);
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
    });

    it('allows to specify a historyBuffer when creating the plot', function () {
        var hb = new HistoryBuffer(10, 1);
        hb.push(33);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].datapoints.points).toEqual([0, 33]);
    });

    it('keeps track of the total number of elements introduced in the buffer', function () {
        var hb = new HistoryBuffer(1, 1);
        hb.push(33);
        hb.push(34);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].datapoints.points).toEqual([1, 34]);
    });

    it('should not redraw if the plot was shutdown', function (done) {
        var firstHistoryBuffer = new HistoryBuffer(1, 1),
            options = {
                series: {
                    historyBuffer: firstHistoryBuffer
                },
                xaxes: [
                    { position: 'bottom', autoScale: 'exact' }
                ],
                yaxes: [
                    { position: 'left', autoScale: 'exact' }
                ]
            };
        firstHistoryBuffer.push(10);
        plot = $.plot(placeholder, [[]], options);

        var secondHistoryBuffer = new HistoryBuffer(1, 1);
        options.series.historyBuffer = secondHistoryBuffer;
        secondHistoryBuffer.push(20);
        var newPlot = $.plot(placeholder, [[]], options);

        // continue pushing to an obsolete history buffer
        firstHistoryBuffer.push(30);

        requestAnimationFrame(function() {
            expect(plot.getData()[0].datapoints.points).toEqual([0, 10]);
            expect(newPlot.getData()[0].datapoints.points).toEqual([0, 20]);
            done();
        });
    });
});
