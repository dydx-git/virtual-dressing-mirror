let coronaData = fetch("https://corona.lmao.ninja/v2/countries/Pakistan?yesterday&strict&query")
let totalConfirmed = document.querySelector('.total-confirmed')
let totalRecovered = document.querySelector('.total-recovered')
let totalDeaths = document.querySelector('.total-deaths')
coronaData.then(response => response.json())
.then(res => {
    console.log(res.cases)
    totalConfirmed.innerHTML = `${res.cases}`;
    totalRecovered.innerHTML = `${res.recovered}`;
    totalDeaths.innerHTML = `${res.deaths}`;
    covidGraph(res);
})

// Chart.defaults.global.defaultFontFamily = 

function covidGraph(results) {
    const labels = [
        'Confirmed',
        'Recovered',
        'Deaths'
      ];
    const data = {
        labels: labels,
        datasets: [{
            label: 'My First dataset',
            backgroundColor: [
                'rgb(153, 102, 255, 0.5)',
                'rgb(75, 192, 192, 0.5)',
                'rgb(255, 99, 132, 0.5)'
            ],
            borderColor: [
                'rgb(153, 102, 255)',
                'rgb(75, 192, 192)',
                'rgb(255, 99, 132)'
            ],
            borderWidth: 5,
            // barThickness: 60,
            data: [results.cases,results.recovered,results.deaths],
        }]
    };
    
    const config = {
        type: 'bar',
        data,
        options: {
            scales: {
                x: {
                    title: {
                        font: {
                            size:20,
                            weight: "bold"
                        },
                        color: '#FEF7DC'
                    },

                    ticks: {
                        font: {
                            size: 30,
                            weight: "lighter"
                        },
                        color: '#FEF7DC'
                    },
                },
                y: {
                    title: {
                        font: {
                            size:20,
                            weight: "bold"
                        },
                        color: '#FEF7DC'
                    },

                    ticks: {
                        font: {
                            size: 30,
                            weight: "lighter"
                        },
                        color: '#FEF7DC'
                    },
                }
            },
            plugins: {
                legend: {
                    labels: {
                        fontFamily: "'Roboto', sans-serif"
                    },
                    display: false,
                }
            }
        }
    };
    var myChart = new Chart(
        document.getElementById('covidChart'),
        config
      );
}

