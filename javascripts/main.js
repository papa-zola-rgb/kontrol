const controlModeSelect = document.getElementById("mode");
const inputFieldsDiv = document.getElementById("input-fields");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const clearButton = document.getElementById("clear");

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  document
    .getElementById("toggleSidebar")
    .addEventListener("click", function () {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });

  document.getElementById("overlay").addEventListener("click", function () {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  overlay.addEventListener("click", function () {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
});

controlModeSelect.addEventListener("change", function () {
  inputFieldsDiv.innerHTML = "";

  switch (this.value) {
    case "satuposisi":
      inputFieldsDiv.innerHTML = `
                <div class="input-group">
                    <label for="sp" class="form-label">Set Point</label>
                    <input type="number" id="sp" placeholder="Enter set point value" class="form-label" required>
                </div>`;
      break;
    case "duaposisi":
      inputFieldsDiv.innerHTML = `
                <div class="input-group">
                    <label for="set_point_atas" class="form-label">Set Point High</label>
                    <input type="number" id="set_point_atas" placeholder="Enter TSPH value" class="form-label" required>
                    <label for="set_point_bawah" class="form-label">Set Point Low</label>
                    <input type="number" id="set_point_bawah" placeholder="Enter TSPL value" class="form-label" required>
                </div>`;
      break;
    case "p":
    case "pd":
    case "pid":
      inputFieldsDiv.innerHTML = `
                <div class="input-group">
                    <label for="kp" class="form-label">
                    <span></span>
                    </label>
                    <input type="number" id="kp" placeholder="Enter kp value" class="form-label" required>
                    ${
                      this.value === "pd" || this.value === "pid"
                        ? `
                        <label for="kd" class="form-label"></label>
                        <input type="number" id="kd" placeholder="Enter kd value" class="form-label" required>`
                        : ""
                    }
                    ${
                      this.value === "pid"
                        ? `
                        <label for="ki" class="form-label"></label>
                        <input type="number" id="ki" placeholder="Enter ki value" class="form-label" required>`
                        : ""
                    }
                    <label for="sp" class="form-label">Set Point</label>
                    <input type="number" id="sp" placeholder="Enter set point value" class="form-label" required>
                </div>`;
      break;
  }
});

let allData = [];
let chart;
let pollingInterval;

startButton.addEventListener("click", function (event) {
  event.preventDefault(); // Penting: Mencegah pengiriman form default

  const mode = document.getElementById("mode").value;
  const time_sampling =
    parseFloat(document.getElementById("time_sampling").value) || null;
  const sp = parseFloat(document.getElementById("sp")?.value) || null;
  const tsph =
    parseFloat(document.getElementById("set_point_atas")?.value) || null; // Perbaiki ID
  const tspl =
    parseFloat(document.getElementById("set_point_bawah")?.value) || null; // Perbaiki ID
  const kp = parseFloat(document.getElementById("kp")?.value) || null;
  const ki = parseFloat(document.getElementById("ki")?.value) || null;
  const kd = parseFloat(document.getElementById("kd")?.value) || null;

  const data = {
    mode: mode,
    time_sampling: time_sampling,
    set_point: sp,
    set_point_atas: tsph,
    set_point_bawah: tspl,
    kp: kp,
    ki: ki,
    kd: kd,
  };

  console.log(data);

  fetch("/main/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Gagal mengirim data ke server:", response.status);
        return response.json().then((err) => {
          throw new Error(err.error || "Gagal mengirim data");
        }); // Parse JSON error
      }
    })
    .then((data) => {
      // Handle response dari server (misalnya, tampilkan pesan sukses)
      console.log("Response dari server:", data);
      alert("Data berhasil disimpan!"); // Berikan feedback ke user
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Terjadi kesalahan: " + error.message); // Tampilkan pesan error ke user
    });

  if (!chart) {
    initializeChart();
  }

  startPollingData(time_sampling, sp, tsph, tspl);
});

stopButton.addEventListener("click", function () {
  clearInterval(pollingInterval);
  console.log("Kontrol dihentikan");
});

clearButton.addEventListener("click", function () {
  clearChart();
});

function startPollingData(samplingtime, setPointValue, tsphValue, tsplValue) {
  allData = [];
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  chart.data.datasets[2].data = [];
  chart.data.datasets[3].data = [];

  let startTime = 0.1;

  pollingInterval = setInterval(() => {
    if (startTime >= samplingtime) {
      clearInterval(pollingInterval);
      return;
    }

    const newsuhu = Math.random() * 150; // Nilai output acak
    allData.push({
      Time: startTime,
      SUHU: newsuhu,
      SetPoint: setPointValue,
      TSPH: tsphValue,
      TSPL: tsplValue,
    });

    // Memperbarui grafik
    updateChart(startTime, newsuhu, setPointValue, tsphValue, tsplValue);
    startTime += 0.1; // Increment waktu
  }, 100); // Update setiap 100 ms
}

function initializeChart() {
  const ctx = document.getElementById("realTimeChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Output Pemanas",
          data: [],
          borderColor: "blue",
          fill: false,
          tension: 0.1,
        },
        {
          label: "Set Point",
          data: [],
          borderColor: "red",
          fill: false,
          tension: 0.1,
        },
        {
          label: "TSPH",
          data: [],
          borderColor: "orange",
          fill: false,
          tension: 0.1,
        },
        {
          label: "TSPL",
          data: [],
          borderColor: "yellow",
          fill: false,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Waktu (s)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Suhu (C)",
          },
        },
      },
    },
  });
}

function updateChart(time, suhu, setPoint, tspH, tspL) {
  const formattedTime = time.toFixed(2);
  chart.data.labels.push(formattedTime);
  chart.data.datasets[0].data.push(suhu);
  chart.data.datasets[1].data.push(setPoint);
  chart.data.datasets[2].data.push(tspH);
  chart.data.datasets[3].data.push(tspL);
  chart.update();
}

function clearChart() {
  allData = [];
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  chart.data.datasets[2].data = [];
  chart.data.datasets[3].data = [];
  chart.update();
  console.log("Grafik dihapus");
}

document.getElementById("exportcsv").addEventListener("click", exportToCSV);
function exportToCSV() {
  const csvHeader = "Time (s), SUHU Output, Set Point, TSPH, TSPL\n";
  let csvContent = csvHeader;

  allData.forEach((row) => {
    const time = row.Time;
    const suhu = row.SUHU || "";
    const setPoint = row.SetPoint || "";
    const tspH = row.TSPH || "";
    const tspL = row.TSPL || "";
    csvContent += `${time}, ${suhu}, ${setPoint}, ${tspH}, ${tspL}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "data_chart.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.onbeforeunload = function () {
  clearInterval(pollingInterval);
};

// const controlModeSelect = document.getElementById("mode");
// const inputFieldsDiv = document.getElementById("input-fields");
// const startButton = document.getElementById("start");
// const stopButton = document.getElementById("stop");
// const clearButton = document.getElementById("clear");

// controlModeSelect.addEventListener("change", function () {
//   inputFieldsDiv.innerHTML = "";

//   switch (this.value) {
//     case "satuposisi":
//       inputFieldsDiv.innerHTML = `
//                 <div class="input-group">
//                     <label for="sp">Set Point</label>
//                     <input type="number" id="sp" placeholder="Enter set point valeu" required>
//                 </div>`;
//       break;
//     case "duaposisi":
//       inputFieldsDiv.innerHTML = `
//                 <div class="input-group">
//                     <label for="tsph">Set Point High</label>
//                     <input type="number" id="tsph" placeholder="Enter TSPH value" required>
//                     <label for="tspl">Set Point Low</label>
//                     <input type="number" id="tspl" placeholder="Enter TSPL value" required>
//                 </div>`;
//       break;
//     case "p":
//     case "pd":
//     case "pid":
//       inputFieldsDiv.innerHTML = `
//                 <div class="input-group">
//                     <label for="kp">Kp</label>
//                     <input type="number" id="kp" placeholder="Enter kp value" required>
//                     ${
//                       this.value === "pd" || this.value === "pid"
//                         ? `
//                         <label for="kd">Kd</label>
//                         <input type="number" id="kd" placeholder="Enter kd value" required>`
//                         : ""
//                     }
//                     ${
//                       this.value === "pid"
//                         ? `
//                         <label for="ki">Ki</label>
//                         <input type="number" id="ki" placeholder="Enter ki value" required>`
//                         : ""
//                     }
//                     <label for="sp">Set Point</label>
//                     <input type="number" id="sp" placeholder="Enter set point value" required>
//                 </div>`;
//       break;
//   }
// });

// let allData = [];
// let chart;
// let pollingInterval;

// startButton.addEventListener("click", function (event) {
//   const sp = parseFloat(document.getElementById("sp")?.value) || null;
//   const tsph = parseFloat(document.getElementById("tsph")?.value) || null;
//   const tspl = parseFloat(document.getElementById("tspl")?.value) || null;
//   const kp = parseFloat(document.getElementById("kp")?.value) || null;
//   const ki = parseFloat(document.getElementById("ki")?.value) || null;
//   const kd = parseFloat(document.getElementById("kd")?.value) || null;
//   const time_sampling =
//     parseFloat(document.getElementById("time_sampling").value) || null;

//   if (!chart) {
//     initializeChart();
//   }

//   startPollingData(time_sampling, sp, tsph, tspl);
// });

// stopButton.addEventListener("click", function () {
//   clearInterval(pollingInterval);
//   console.log("Kontrol dihentikan");
// });

// clearButton.addEventListener("click", function () {
//   clearChart();
// });

// function startPollingData(samplingtime, setPointValue, tsphValue, tsplValue) {
//   allData = [];
//   chart.data.labels = [];
//   chart.data.datasets[0].data = [];
//   chart.data.datasets[1].data = [];

//   let startTime = 0.1;

//   pollingInterval = setInterval(() => {
//     if (startTime >= samplingtime) {
//       clearInterval(pollingInterval);
//       return;
//     }

//     const newsuhu = Math.random() * 150; // Nilai output acak
//     allData.push({
//       Time: startTime,
//       SUHU: newsuhu,
//       SetPoint: setPointValue,
//       TSPH: tsphValue,
//       TSPL: tsplValue,
//     });

//     // Memperbarui grafik
//     updateChart(startTime, newsuhu, setPointValue, tsphValue, tsplValue);
//     startTime += 0.1; // Increment waktu
//   }, 100); // Update setiap 100 ms
// }

// function initializeChart() {
//   const ctx = document.getElementById("realTimeChart").getContext("2d");
//   chart = new Chart(ctx, {
//     type: "line",
//     data: {
//       labels: [],
//       datasets: [
//         {
//           label: "Output Pemanas",
//           data: [],
//           borderColor: "blue",
//           fill: false,
//           tension: 0.1,
//         },
//         {
//           label: "Set Point",
//           data: [],
//           borderColor: "red",
//           fill: false,
//           tension: 0.1,
//         },
//         {
//           label: "TSPH",
//           data: [],
//           borderColor: "orange",
//           fill: false,
//           tension: 0.1,
//         },
//         {
//           label: "TSPL",
//           data: [],
//           borderColor: "yellow",
//           fill: false,
//           tension: 0.1,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       scales: {
//         x: {
//           title: {
//             display: true,
//             text: "Waktu (s)",
//           },
//         },
//         y: {
//           title: {
//             display: true,
//             text: "Suhu (C)",
//           },
//         },
//       },
//     },
//   });
// }

// function updateChart(time, suhu, setPoint, tspH, tspL) {
//   const formattedTime = time.toFixed(2);
//   chart.data.labels.push(formattedTime);
//   chart.data.datasets[0].data.push(suhu);
//   chart.data.datasets[1].data.push(setPoint);
//   chart.data.datasets[2].data.push(tspH);
//   chart.data.datasets[3].data.push(tspL);
//   chart.update();
// }

// function clearChart() {
//   allData = [];
//   chart.data.labels = [];
//   chart.data.datasets[0].data = [];
//   chart.data.datasets[1].data = [];
//   chart.data.datasets[2].data = [];
//   chart.data.datasets[3].data = [];
//   chart.update();
//   console.log("Grafik dihapus");
// }

// document.getElementById("exportcsv").addEventListener("click", exportToCSV);
// function exportToCSV() {
//   const csvHeader = "Time (s), SUHU Output, Set Point, TSPH, TSPL\n";
//   let csvContent = csvHeader;

//   allData.forEach((row) => {
//     const time = row.Time;
//     const suhu = row.SUHU || "";
//     const setPoint = row.SetPoint || "";
//     const tspH = row.TSPH || "";
//     const tspL = row.TSPL || "";
//     csvContent += `${time}, ${suhu}, ${setPoint}, ${tspH}, ${tspL}\n`;
//   });

//   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//   const link = document.createElement("a");
//   const url = URL.createObjectURL(blob);

//   link.setAttribute("href", url);
//   link.setAttribute("download", "data_chart.csv");
//   link.style.visibility = "hidden";
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// }

// window.onbeforeunload = function () {
//   clearInterval(pollingInterval);
// };
