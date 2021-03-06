/*global d3, HistoryBuffer*/

$(function () {
    'use strict';

    var width = 600,
        height = 600;
    var diameter = 500;
    var duration = 500;
    var root;
    var radial = false;

    /* get the tree nodes at the specified level that keeps the information for the specified interval*/
    HistoryBufferNumeric.prototype.getTreeNodes = function (level, start, end) {
        var nodes = [];
        var treeLevel = this.tree.levels[level];
        var levelStep = treeLevel.step;

        var levelIndex = Math.floor((start - treeLevel.startIndex) / levelStep);

        if ((levelIndex < 0) || (levelIndex >= treeLevel.capacity) || levelIndex > end) {
            return nodes;
        }

        while (levelIndex < end) {
            if (levelIndex >= start) {
                nodes.push(treeLevel.nodes.get(levelIndex));
            }

            levelIndex += treeLevel.step;
        }

        return nodes;
    };

    var buffer = new HistoryBufferNumeric(32, 1);
    buffer.setBranchingFactor(4);

    $.plot('#placeholder', [], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
        },
        legend: {
            show: false
        }
    });

    var counter = 0;

    function updateData() {
        var sin = 10 * Math.sin(counter++ * 0.5);
        buffer.push(sin);
        root = getData();
        drawTree();
    }

    setInterval(updateData, 500);

    function levelToD3(buffer, depth, start, end) {
        var accTree = buffer.tree.tree;
        if (depth < 0) {
            var childs = [];

            for (var i = start; i < end; i++) {
                if (i < buffer.startIndex() || i >= (buffer.startIndex() + buffer.capacity)) {
                    continue;
                }
                var val = buffer.get(i);
                if (val !== undefined) {
                    childs.push({
                        name: '' + i + ', ' + buffer.get(i).toFixed(1)
                    });
                } else {
                    childs.push({
                        name: '',
                        empty: true
                    });
                }
            }
            return childs;
        }

        var level = accTree.levels[depth];
        start = Math.floor(start / level.step) * level.step;

        var nodes = [];
        while (start < end) {
            var node = buffer.tree.getTreeNode(depth, start);

            if (node) {
                nodes.push({
                    name: node.max === undefined ? '' : '[' + node.max.toFixed(1) + ', ' + node.min.toFixed(1) + ']',
                    children: levelToD3(buffer, depth - 1, start, start + level.step)
                });
            }

            start += level.step;
        }
        return nodes;
    }

    function accTree2d3(buffer) {
        var accTree = buffer.tree.tree;
        var depth = accTree.depth;
        var level = accTree.levels[depth - 1];

        return levelToD3(buffer, depth - 1, level.startIndex, level.startIndex + level.capacity * level.step);
    }

    function getData() {
        var root = {
            name: '',
            children: accTree2d3(buffer),
            root: true
        };

        return root;
    }

    root = getData();

    function change() {
        if (this.value === 'radialtree') {
            transitionToRadialTree();
        } else if (this.value === 'tree') {
            transitionToTree();
        }
    }

    d3.selectAll('input').on('change', change);

    function transitionToRadialTree() {
        var nodes = radialTree.nodes(root), // recalculate layout
            links = radialTree.links(nodes);

        svg.transition().duration(duration)
            .attr('transform', 'translate(' + (width / 2) + ',' +
                (height / 2) + ')');
        // set appropriate translation (origin in middle of svg)

        link.data(links)
            .transition()
            .duration(duration)
            .style('stroke', '#fc8d62')
            .attr('d', radialDiagonal); //get the new radial path

        node.data(nodes)
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                return 'rotate(' + (d.x) + ')translate(' + d.y + ')';
            });

        node.select('circle')
            .transition()
            .duration(duration)
            .style('stroke', '#984ea3');
        radial = true;
    }

    function transitionToTree() {
        var nodes = tree.nodes(root), //recalculate layout
            links = tree.links(nodes);

        svg.transition().duration(duration)
            .attr('transform', 'translate(40,0)');

        link.data(links)
            .transition()
            .duration(duration)
            .style('stroke', '#e78ac3')
            .attr('d', diagonal); // get the new tree path

        node.data(nodes)
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                return 'translate(' + d.y + ',' + d.x + ')';
            });

        node.select('circle')
            .transition()
            .duration(duration)
            .style('stroke', '#377eb8');
        radial = false;
    }

    var tree = d3.layout.tree()
        .size([height, width - 160]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var radialTree = d3.layout.tree()
        .size([360, diameter / 2])
        .separation(function (a, b) {
            return (a.parent === b.parent ? 1 : 1) / a.depth;
        });

    var radialDiagonal = d3.svg.diagonal.radial()
        .projection(function (d) {
            return [d.y, d.x / 180 * Math.PI];
        });

    var svg = d3.select('#treeHolder').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(40,0)');

    var nodes, links, node, link;

    function drawTree() {
        svg.selectAll('.node').remove();
        svg.selectAll('.link').remove();

        if (radial) {
            svg.attr('transform', 'translate(' + (width / 2) + ',' +
                (height / 2) + '),rotate(' + (buffer.startIndex() / buffer.capacity * 360) + ')');
        } else {
            svg.attr('transform', 'translate(40,0)');
        }

        if (radial) {
            nodes = radialTree.nodes(root);
            links = radialTree.links(nodes);
        } else {
            nodes = tree.nodes(root);
            links = tree.links(nodes);
        }

        link = svg.selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('stroke', '#ade0fb')
            .attr('d', radial ? radialDiagonal : diagonal);

        node = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', function (d) {
                if (radial) {
                    return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')';
                } else {
                    return 'translate(' + d.y + ',' + d.x + ')';
                }
            });

        node.append('circle')
            .attr('r', function (d) {
                return d.root ? 8.5 : 4.5;
            })
            .style('stroke', function (d) {
                return d.empty ? '#ff0000' : '#377eb8';
            });

        node.append('text')
            .attr('dx', function (d) {
                return d.children ? -8 : 8;
            })
            .attr('dy', 3)
            .style('text-anchor', function (d) {
                return d.children ? 'end' : 'start';
            })
            .text(function (d) {
                return d.name;
            });
    }

    drawTree();
});
