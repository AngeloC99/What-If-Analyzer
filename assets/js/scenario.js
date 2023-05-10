function fillData() {
    if (!localStorage.getItem('scenario1') && !localStorage.getItem('scenario2') && !localStorage.getItem('scenario3')) {
        chooseScenarios(setScenarios);
    }
    else {
        setScenarios();
    }
}

function setScenarios() {
    var scenario1 = JSON.parse(localStorage.getItem('scenario1'));
    var scenario2 = JSON.parse(localStorage.getItem('scenario2'));
    var scenario3 = JSON.parse(localStorage.getItem('scenario3'));
    insertCost(scenario1,scenario2,scenario3);
    insertTime(scenario1,scenario2,scenario3);
    insertMould(scenario1,scenario2,scenario3);
}

function chooseScenarios(callback) {
    if(!localStorage.getItem('scenarios')) {
        var nums = new Set();
        while (nums.size < 3) {
            nums.add(Math.floor(Math.random() * 10) + 1);
        }
        var scenarios = [...nums];
        localStorage.setItem('scenarios', JSON.stringify(scenarios));
    }

    var scenarios = JSON.parse(localStorage.getItem('scenarios'));
    const url_requests = [`http://localhost:8000/simulations/scenario${scenarios[0]}.json`, `http://localhost:8000/simulations/scenario${scenarios[1]}.json`, `http://localhost:8000/simulations/scenario${scenarios[2]}.json`];

    for (let i = 0; i < url_requests.length; i++) {
        const key = `scenario${i+1}`;
        const url = url_requests[i];
        if(!localStorage.getItem(key)) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.onload = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    localStorage.setItem(key, JSON.stringify(data));                 
                }
            };
            xhr.onerror = function() {
                reject(xhr.statusText);
            };
            xhr.send();
        };
    }
    callback();
}

function insertCost(scenario1,scenario2,scenario3){
    const sample = [
        {
        scenario: 'Scenario 1',
        value: scenario1['totalCostScenario'].toFixed(2),
        color: '#000000'
        },
        {
        scenario: 'Scenario 2',
        value: scenario2['totalCostScenario'].toFixed(2),
        color: '#00a2ee'
        },
        {
        scenario: 'Scenario 3',
        value: scenario3['totalCostScenario'].toFixed(2),
        color: '#fbcb39'
        }
    ];
    
    const svg = d3.select('svg');
    const svgContainer = d3.select('#container');
    
    const margin = 80;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;
    
    const chart = svg.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.4)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0.99999*Math.min(sample[0].value,sample[1].value,sample[2].value), 
        Math.max(sample[0].value,sample[1].value,sample[2].value)]);
    
        
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
    barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
              return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d'
            }
            else {
              return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(2)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}\u20AC`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}\u20AC`)
    
    svg
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Total Cost (\u20AC)')
    
    svg.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Total Cost Comparison')
}

function insertTime(scenario1,scenario2,scenario3){
    const sample = [
        {
        scenario: 'Scenario 1',
        value: ((scenario1['totalProductionTimeScenario']/60)/60).toFixed(2),
        color: '#000000'
        },
        {
        scenario: 'Scenario 2',
        value: ((scenario2['totalProductionTimeScenario']/60)/60).toFixed(2),
        color: '#00a2ee'
        },
        {
        scenario: 'Scenario 3',
        value: ((scenario3['totalProductionTimeScenario']/60)/60).toFixed(2),
        color: '#fbcb39'
        }
    ];
    
    const svg1 = d3.select('#containerTime').append("svg");
    
    const margin = 80;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;
    
    const chart = svg1.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.4)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0.9*Math.min(sample[0].value,sample[1].value,sample[2].value), 
        Math.max(sample[0].value,sample[1].value,sample[2].value)]);
    
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
    barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
              return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d'
            }
            else {
              return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(2)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}h`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}h`)
    
    svg1
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Total Time (h)')
    
    svg1.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg1.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Total Time Comparison')
}

function insertMould(scenario1,scenario2,scenario3) {
    const sample = [
        {
            scenario: 'Scenario 1',
            value: scenario1['totalMouldChangesScenario'],
            color: '#000000'
        },
        {
            scenario: 'Scenario 2',
            value: scenario2['totalMouldChangesScenario'],
            color: '#00a2ee'
        },
        {
            scenario: 'Scenario 3',
            value: scenario3['totalMouldChangesScenario'],
            color: '#fbcb39'
        }
    ];
    
    const svg2 = d3.select('#containerMould').append("svg");
    
    const margin = 80;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;
    
    const chart = svg2.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.4)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0.9*Math.min(sample[0].value,sample[1].value,sample[2].value), 
        Math.max(sample[0].value,sample[1].value,sample[2].value)]);
    
    // vertical grid lines
    // const makeXLines = () => d3.axisBottom()
    //   .scale(xScale)
    
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    // vertical grid lines
    // chart.append('g')
    //   .attr('class', 'grid')
    //   .attr('transform', `translate(0, ${height})`)
    //   .call(makeXLines()
    //     .tickSize(-height, 0, 0)
    //     .tickFormat('')
    //   )
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
    barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
              return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d'
            }
            else {
              return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}`)
    
    svg2
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Mould Changes (#)')
    
    svg2.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg2.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Required Mould Changes Comparison')
}

function showScenarioComparison() {
    var scenario1 = JSON.parse(localStorage.getItem('scenario1'));
    var scenario2 = JSON.parse(localStorage.getItem('scenario2'));
    var scenario3 = JSON.parse(localStorage.getItem('scenario3'));

    insertComparison(scenario1,scenario2,scenario3);

    document.getElementById("cost1").innerHTML += scenario1['totalCostScenario'].toFixed(2) + " \u20AC";
    document.getElementById("time1").innerHTML += ((scenario1['totalProductionTimeScenario']/60)/60).toFixed(2) + " h";
    document.getElementById("mould1").innerHTML += scenario1['totalMouldChangesScenario'];

    document.getElementById("cost2").innerHTML += scenario2['totalCostScenario'].toFixed(2) + " \u20AC";
    document.getElementById("time2").innerHTML += ((scenario2['totalProductionTimeScenario']/60)/60).toFixed(2) + " h";
    document.getElementById("mould2").innerHTML += scenario2['totalMouldChangesScenario'];

    document.getElementById("cost3").innerHTML += scenario3['totalCostScenario'].toFixed(2) + " \u20AC";
    document.getElementById("time3").innerHTML += ((scenario3['totalProductionTimeScenario']/60)/60).toFixed(2) + " h";
    document.getElementById("mould3").innerHTML += scenario3['totalMouldChangesScenario'];
}

function insertComparison(scenario1,scenario2,scenario3){
    const sample = [
        {
            scenario: 'Cost#1',
            value: scenario1['totalCostScenario'].toFixed(2),
            color: '#000000'
        },
        {
            scenario: 'Time#1',
            value: ((scenario1['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#000000'
        },
        {
            scenario: 'Mould#1',
            value: scenario1['totalMouldChangesScenario'],
            color: '#000000'
        },
        {
            scenario: 'Cost#2',
            value: scenario2['totalCostScenario'].toFixed(2),
            color: '#00a2ee'
        },
        {
            scenario: 'Time#2',
            value: ((scenario2['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#00a2ee'
        },
        {
            scenario: 'Mould#2',
            value: scenario2['totalMouldChangesScenario'],
            color: '#00a2ee'
        },
        {
            scenario: 'Cost#3',
            value: scenario3['totalCostScenario'].toFixed(2),
            color: '#fbcb39'
        },
        {
            scenario: 'Time#3',
            value: ((scenario3['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#fbcb39'
        },
        {
            scenario: 'Mould#3',
            value: scenario3['totalMouldChangesScenario'],
            color: '#fbcb39'
        }
    ];
    
    const svg = d3.select('svg');
    const svgContainer = d3.select('#container');
    
    const margin = 80;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;
    
    const chart = svg.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.27)

    const yScaleLeft = d3.scaleLinear()
        .range([height, 0])
        .domain([0.99999 * Math.min(sample[0].value, sample[3].value, sample[6].value), Math.max(sample[0].value, sample[3].value, sample[6].value)]);
    
    const yScaleLeft1 = d3.scaleLinear()
        .range([height, 0])
        .domain([0.9 * Math.min(sample[2].value, sample[5].value, sample[8].value), Math.max(sample[2].value, sample[5].value, sample[8].value)]);

    const yScaleRight = d3.scaleLinear()
        .range([height, 0])
        .domain([0.99 * Math.min(sample[1].value, sample[4].value, sample[7].value), Math.max(sample[1].value, sample[4].value, sample[7].value)]);
    
    const yAxisLeft = d3.axisLeft(yScaleLeft);
    const yAxisLeft1 = d3.axisLeft(yScaleLeft1);
    const yAxisRight = d3.axisRight(yScaleRight);
        
    const makeYLines = () => d3.axisLeft()
        .scale(yScaleLeft);
        
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
        
    chart.append('g')
        .call(yAxisLeft)
        .style('stroke', '#83d3c9');

    chart.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(yAxisLeft1)
        .style('stroke', '#15b097');
        
    chart.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(yAxisRight)
        .style('stroke', '#49d49d');
        
/*    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')); 

    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0.99999*Math.min(sample[0].value,sample[1].value,sample[2].value), 
        Math.max(sample[0].value,sample[1].value,sample[2].value)]);
        
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    */
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
    barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        //.attr('y', (g) => yScale(g.value))
        .attr('y', (g) => {
            if (g.scenario.includes('Cost')) {
                return yScaleLeft(g.value); // Use right y-scale
            } else if (g.scenario.includes('Time')) {
                return yScaleRight(g.value); // Use left y-scale
            } else {
                return yScaleLeft1(g.value); // Use left y-scale
            }
        })
        //.attr('height', (g) => height - yScaleRight(g.value))
        .attr('height', (g) => {
            if (g.scenario.includes('Cost')) {
                return height - yScaleLeft(g.value); // Use right y-scale
            } else if (g.scenario.includes('Time')) {
                return height - yScaleRight(g.value); // Use left y-scale
            }
            else {
                return height - yScaleLeft1(g.value); // Use left y-scale
            }
        })
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
                if (d.scenario.includes('Cost')) {
                return '#83d3c9';
                } 
                else if (d.scenario.includes('Time')){
                    return '#49d49d'
                }
                else {
                return '#15b097';
                }
            })
        .on('mouseenter', function (actual, i) {
            d3.selectAll('.value')
                .attr('opacity', 0)
        
            d3.select(this)
                .transition()
                .duration(300)
                .attr('opacity', 0.8)
                .attr('x', (a) => xScale(a.scenario) - 5)
                .attr('width', xScale.bandwidth() + 10)
            
            const y_right = yScaleRight(actual.value);
            const y_left = yScaleLeft(actual.value);
            const y_left1 = yScaleLeft1(actual.value);
        
            line = chart.append('line')
                .attr('id', 'limit')
                .attr('x1', 0)
                .attr('y1', function() {
                    if (actual.scenario.includes('Cost')) {
                        return y_left; // Use left y-scale
                    } else if (actual.scenario.includes('Time')) {
                        return y_right; // Use right y-scale
                    }
                    else {
                        return y_left1; // Use left y-scale 1
                    }
            })
            //.attr('y1', y)
            .attr('x2', width)
            //.attr('y2', y)
            .attr('y2', function() {
                if (actual.scenario.includes('Cost')) {
                    return y_left; // Use right y-scale
                } else if (actual.scenario.includes('Time')) {
                    return y_right; // Use right y-scale
                }
                else {
                    return y_left1; // Use left y-scale 1
                }
            })
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            //.attr('y', (a) => yScale(a.value) + 30)
            .attr('y', (a) => {
                if (a.scenario.includes('Cost')) {
                    return yScaleLeft(a.value) + 30; // Use right y-scale
                } else if (a.scenario.includes('Time')) {
                    return yScaleRight(a.value) + 30; // Use left y-scale
                } else {
                    return yScaleLeft1(a.value) + 30; // Use left y-scale
                }
            })
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
                if (a.scenario.includes("Cost") && actual.scenario.includes("Cost")) {
                    const divergence = (a.value - actual.value).toFixed(2)
                    
                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}\u20AC`
            
                    return idx !== i ? text : '';
                }
                else if (a.scenario.includes("Time") && actual.scenario.includes("Time")) {
                    const divergence = (a.value - actual.value).toFixed(2)
                    
                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}h`
            
                    return idx !== i ? text : '';
                } 
                else if (a.scenario.includes("Mould") && actual.scenario.includes("Mould")) {
                    const divergence = (a.value - actual.value)
                    
                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}`
            
                    return idx !== i ? text : '';
                }
                
            })
    
        })
        .on('mouseleave', function () {
            d3.selectAll('.value')
                .attr('opacity', 1)
        
            d3.select(this)
                .transition()
                .duration(300)
                .attr('opacity', 1)
                .attr('x', (a) => xScale(a.scenario))
                .attr('width', xScale.bandwidth())
        
            chart.selectAll('#limit').remove()
            chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        //.attr('y', (a) => yScale(a.value) + 30)
        .attr('y', (a) => {
            if (a.scenario.includes('Cost')) {
                return yScaleLeft(a.value) + 30; // Use right y-scale
            } else if (a.scenario.includes('Time')) {
                return yScaleRight(a.value) + 30; // Use left y-scale
            } else {
                return yScaleLeft1(a.value) + 30; // Use left y-scale
            }
        })
        .attr('text-anchor', 'middle')
        //.text((a) => `${a.value}\u20AC`)
        .text((a) => {
            if (a.scenario.includes("Cost")){
                return `${a.value}\u20AC`
            }
            else if (a.scenario.includes("Time")) {
                return `${a.value}h`
            }
            else {
                return `${a.value}`
            }
        })
    
    /*svg
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 9)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Total Cost (\u20AC)')  */
    
    /*svg.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios Metrics')*/
    
    svg.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Complete Scenarios Comparison')
}


function insertCostComparison(scenario1,scenario2,scenario3) {
    const sample = [
        {
            scenario: 'Scenario 1',
            value: scenario1['totalCostScenario'].toFixed(2),
            color: '#000000'
        },
        {
            scenario: 'Scenario 2',
            value: scenario2['totalCostScenario'].toFixed(2),
            color: '#000000'
        },

        {
            scenario: 'Scenario 3',
            value: scenario3['totalCostScenario'].toFixed(2),
            color: '#000000'
        }
    ];
    
    const svg = d3.select('svg');
    const svgContainer = d3.select('#container');
    
    const margin = 80;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;
    
    const chart = svg.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);

    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.2)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 20000]);
    
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    

    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
     
    barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
              return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d'
            }
            else {
              return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
            d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(2)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}\u20AC`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}\u20AC`)
    
    svg
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Total Cost (\u20AC)')

    svg.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Total Cost Comparison')
}

function insertTimeComparison(scenario1,scenario2,scenario3) {
    const sample = [
        {
            scenario: 'Scenario 1',
            value: ((scenario1['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#000000'
        },
        {
            scenario: 'Scenario 2',
            value: ((scenario2['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#000000'
        },

        {
            scenario: 'Scenario 3',
            value: ((scenario3['totalProductionTimeScenario']/60)/60).toFixed(2),
            color: '#000000'
        }
    ];

    const svg1 = d3.select('#containerTime').append("svg");
    
    const margin = 80;
    const width = 500 - 2 * margin;
    const height = 300 - 2 * margin;
    
    const chart = svg1.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.2)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 4000]);
    
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
        barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
                return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d';
            }
            else {
                return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(2)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}h`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}h`)
    
    svg1
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Total Time (h)')
    
    svg1.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg1.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Total Time Comparison');
}

function insertMouldComparison(scenario1,scenario2,scenario3) {
    const sample = [
        {
        scenario: 'Scenario 1',
        value: scenario1['totalMouldChangesScenario'],
        color: '#000000'
        },
        {
        scenario: 'Scenario 2',
        value: scenario2['totalMouldChangesScenario'],
        color: '#00a2ee'
        },
        {
        scenario: 'Scenario 3',
        value: scenario3['totalMouldChangesScenario'],
        color: '#fbcb39'
        }
    ];

    const svg2 = d3.select('#containerMould').append("svg");
    
    const margin = 80;
    const width = 500 - 2 * margin;
    const height = 300 - 2 * margin;
    
    const chart = svg2.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(sample.map((s) => s.scenario))
        .padding(0.2)
    
    // To handle the scale of the values on the y-axis
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 25]);
    
    const makeYLines = () => d3.axisLeft()
        .scale(yScale)
    
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    chart.append('g')
        .call(d3.axisLeft(yScale));
    
    chart.append('g')
        .attr('class', 'grid')
        .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
        )
    
    const barGroups = chart.selectAll()
        .data(sample)
        .enter()
        .append('g')
    
        barGroups
        .append('rect')
        .attr('class', 'barr')
        .attr('x', (g) => xScale(g.scenario))
        .attr('y', (g) => yScale(g.value))
        .attr('height', (g) => height - yScale(g.value))
        .attr('width', xScale.bandwidth())
        .attr('fill', function(d) {
            if (d.scenario.includes('1')) {
              return '#83d3c9';
            } 
            else if (d.scenario.includes('2')){
                return '#49d49d'
            }
            else {
              return '#15b097';
            }
          })
        .on('mouseenter', function (actual, i) {
        d3.selectAll('.value')
            .attr('opacity', 0)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('x', (a) => xScale(a.scenario) - 5)
            .attr('width', xScale.bandwidth() + 10)
    
        const y = yScale(actual.value)
    
        line = chart.append('line')
            .attr('id', 'limit')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
    
        barGroups.append('text')
            .attr('class', 'divergence')
            .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(2)
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}h`
    
            return idx !== i ? text : '';
            })
    
        })
        .on('mouseleave', function () {
        d3.selectAll('.value')
            .attr('opacity', 1)
    
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('x', (a) => xScale(a.scenario))
            .attr('width', xScale.bandwidth())
    
        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
        })
    
    barGroups 
        .append('text')
        .attr('class', 'value')
        .attr('x', (a) => xScale(a.scenario) + xScale.bandwidth() / 2)
        .attr('y', (a) => yScale(a.value) + 30)
        .attr('text-anchor', 'middle')
        .text((a) => `${a.value}`)
    
    svg2
        .append('text')
        .attr('class', 'label')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 3.3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Mould Changes (#)')
    
    svg2.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Scenarios')
    
    svg2.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Required Mould Changes Comparison')
}


function goToScenario(scenarioId) {
    window.location.href = 'scenarioDetails.html?scenario=' + scenarioId;
}