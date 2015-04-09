/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer */
/* jshint browser: true*/

describe('History Buffer', function () {
    'use strict';

    it('should have a capacity property', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.capacity).toBe(10);
    });

    it('should have a setCapacity method', function () {
        var hb = new HistoryBuffer(10);

        hb.setCapacity(20);
        expect(hb.capacity).toBe(20);
    });

    it('should pop undefined when empty', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.pop()).toBe(undefined);
    });

    it('should pop the last value in the buffer', function () {
        var hb = new HistoryBuffer(10);

        hb.buffer.push(1, 2, 3);

        expect(hb.pop()).toBe(3);
    });

    it('should have an appendArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        [3, 2, 1, undefined].forEach(function (exp) {
            expect(hb.pop()).toBe(exp);
        });
    });

    it('should have a toArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        expect(hb.toArray()).toEqual([1, 2, 3]);
    });

    it('should have a toArray method', function () {
        var hb = new HistoryBuffer(3);

        hb.appendArray([1, 2, 3]);
        hb.push(4);

        expect(hb.toArray()).toEqual([2, 3, 4]);
    });

    describe('Acceleration tree', function () {
        it('should be created on hb creation', function () {
            var hb = new HistoryBuffer(128);

            expect(hb.tree).toEqual(jasmine.any(Object));
        });

        describe('One level deep', function () {
            it('should compute the max and min correctly for tree elements', function () {
                var hb = new HistoryBuffer(10);

                hb.appendArray([1, 2, 3]);

                hb.populateAccelerationTree();

                expect(hb.tree.depth).toEqual(1);
                expect(hb.tree.levels).toEqual(jasmine.any(Array));
                expect(hb.tree.levels.length).toEqual(1);
                expect(hb.tree.levels[0].nodes.length).toBe(1);
                expect(hb.tree.levels[0].nodes[0].min).toBe(1);
                expect(hb.tree.levels[0].nodes[0].max).toBe(3);
            });

            it('should compute the max and min correctly for 64 elements', function () {
                var hb = new HistoryBuffer(128);

                for (var i = 0; i < 64; i++) {
                    hb.push(i);
                }

                hb.populateAccelerationTree();

                expect(hb.tree.depth).toEqual(1);
                expect(hb.tree.levels).toEqual(jasmine.any(Array));
                expect(hb.tree.levels.length).toEqual(1);
                expect(hb.tree.levels[0].nodes.length).toBe(2);
                expect(hb.tree.levels[0].nodes[0].min).toBe(0);
                expect(hb.tree.levels[0].nodes[0].max).toBe(31);
                expect(hb.tree.levels[0].nodes[1].min).toBe(32);
                expect(hb.tree.levels[0].nodes[1].max).toBe(63);
            });
        });

        describe('Two levels deep', function () {
            it('should create a proper acceleration tree with two levels', function () {
                var hb = new HistoryBuffer(32 * 32 * 2);

                expect(hb.tree.depth).toEqual(2);
            });

            it('should compute the max and min correctly for 2048 elements', function () {
                var hb = new HistoryBuffer(32 * 32 * 2);

                for (var i = 0; i < 2 * 32 * 32; i++) {
                    hb.push(i);
                }

                hb.populateAccelerationTree();

                expect(hb.tree.levels).toEqual(jasmine.any(Array));
                expect(hb.tree.levels.length).toEqual(2);
                expect(hb.tree.levels[1].nodes.length).toBe(2);
                expect(hb.tree.levels[1].nodes[0].min).toBe(0);
                expect(hb.tree.levels[1].nodes[0].max).toBe(1023);
                expect(hb.tree.levels[1].nodes[1].min).toBe(1024);
                expect(hb.tree.levels[1].nodes[1].max).toBe(2047);
            });
        });

        describe('Three levels deep', function () {
            it('should create a proper acceleration tree with three levels', function () {
                var hb = new HistoryBuffer(32 * 32 * 32 * 2);

                expect(hb.tree.depth).toEqual(3);
            });

            it('should compute the max and min correctly for 65536 elements', function () {
                var hb = new HistoryBuffer(32 * 32 * 32 * 2);

                for (var i = 0; i < 2 * 32 * 32 * 32; i++) {
                    hb.push(i);
                }

                hb.populateAccelerationTree();

                expect(hb.tree.levels).toEqual(jasmine.any(Array));
                expect(hb.tree.levels.length).toEqual(3);
                expect(hb.tree.levels[2].nodes.length).toBe(2);
                expect(hb.tree.levels[2].nodes[0].min).toBe(0);
                expect(hb.tree.levels[2].nodes[0].max).toBe(32767);
                expect(hb.tree.levels[2].nodes[1].min).toBe(32768);
                expect(hb.tree.levels[2].nodes[1].max).toBe(65535);
            });
        });
    });
});