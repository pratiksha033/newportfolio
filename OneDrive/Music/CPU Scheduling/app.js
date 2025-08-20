$(document).ready(function() {
    $(".form-group-time-quantum").hide();
  
    // Show/hide time quantum input for Round Robin
    $('#algorithmSelector').on('change', function() {
      if (this.value === 'optRR') {
        $(".form-group-time-quantum").show(1000);
      } else {
        $(".form-group-time-quantum").hide(1000);
      }
    });
  
    var processList = [];
    var originProcessList = [];
  
    // Add process with priority field
    $('#btnAddProcess').on('click', function() {
      var processID = $('#processID');
      var arrivalTime = $('#arrivalTime');
      var burstTime = $('#burstTime');
      var priority = $('#priority');
  
      if (processID.val() === '' || arrivalTime.val() === '' || burstTime.val() === '') {
        processID.addClass('is-invalid');
        arrivalTime.addClass('is-invalid');
        burstTime.addClass('is-invalid');
        return;
      }
  
      var process = {
        processID: parseInt(processID.val(), 10),
        arrivalTime: parseInt(arrivalTime.val(), 10),
        burstTime: parseInt(burstTime.val(), 10),
        priority: priority.val() ? parseInt(priority.val(), 10) : 0
      };
  
      processList.push(process);
      originProcessList.push(Object.assign({}, process));
  
      $('#tblProcessList > tbody:last-child').append(
        `<tr>
          <td>${processID.val()}</td>
          <td>${arrivalTime.val()}</td>
          <td>${burstTime.val()}</td>
          <td>${priority.val() || '-'}</td>
        </tr>`
      );
  
      processID.val('');
      arrivalTime.val('');
      burstTime.val('');
      priority.val('');
    });
  
    // Calculate scheduling on button click
    $('#btnCalculate').on('click', function() {
      if (processList.length == 0) {
        alert('Please insert some processes');
        return;
      }
  
      $("#tblResults td").remove();
      $("#ganttChart td").remove();
  
      var selectedAlgo = $('#algorithmSelector').children('option:selected').val();
  
      if (selectedAlgo === 'optFCFS') {
        firstComeFirstServed();
      } else if (selectedAlgo === 'optSJF') {
        shortestJobFirst();
      } else if (selectedAlgo === 'optSRTF') {
        shortestRemainingTimeFirst();
      } else if (selectedAlgo === 'optRR') {
        roundRobin();
      } else if (selectedAlgo === 'optPriority') {
        priorityScheduling();
      }
    });
  
    // FCFS
    function firstComeFirstServed() {
      var time = 0, queue = [], completedList = [];
  
      while (processList.length > 0 || queue.length > 0) {
        addToQueue();
        while (queue.length == 0) {
          time++;
          addToQueue();
        }
        var process = queue.shift();
        for (var i = 0; i < process.burstTime; i++) {
          time++;
          addToQueue();
        }
        process.completedTime = time;
        process.turnAroundTime = process.completedTime - process.arrivalTime;
        process.waitingTime = process.turnAroundTime - process.burstTime;
        completedList.push(process);
      }
  
      function addToQueue() {
        for (var i = 0; i < processList.length; i++) {
          if (time >= processList[i].arrivalTime) {
            queue.push(processList.splice(i, 1)[0]);
            i--;
          }
        }
      }
      displayResults(completedList);
    }
  
    // SJF
    function shortestJobFirst() {
      var time = 0, queue = [], completedList = [];
      while (processList.length > 0 || queue.length > 0) {
        addToQueue();
        while (queue.length == 0) {
          time++;
          addToQueue();
        }
        var processToRun = selectProcess();
        for (var i = 0; i < processToRun.burstTime; i++) {
          time++;
          addToQueue();
        }
        processToRun.completedTime = time;
        processToRun.turnAroundTime = processToRun.completedTime - processToRun.arrivalTime;
        processToRun.waitingTime = processToRun.turnAroundTime - processToRun.burstTime;
        completedList.push(processToRun);
      }
  
      function addToQueue() {
        for (var i = 0; i < processList.length; i++) {
          if (processList[i].arrivalTime === time) {
            queue.push(processList.splice(i, 1)[0]);
            i--;
          }
        }
      }
  
      function selectProcess() {
        if(queue.length != 0) {
          queue.sort((a,b) => a.burstTime - b.burstTime || a.processID - b.processID);
        }
        return queue.shift();
      }
      displayResults(completedList);
    }
  
    // SRTF
    function shortestRemainingTimeFirst() {
      var completedList = [], time=0, queue=[];
      while (processList.length>0 || queue.length>0) {
        addToQueue();
        while(queue.length == 0){
          time++; addToQueue();
        }
        selectProcessForSRTF();
        runSRTF();
      }
  
      function addToQueue() {
        for(var i=0; i<processList.length; i++){
          if(processList[i].arrivalTime === time){
            queue.push(processList.splice(i,1)[0]);
            i--;
          }
        }
      }
      var i=0;
      function selectProcessForSRTF(){
        if(queue.length != 0) {
          queue.sort((a,b) => a.burstTime - b.burstTime || a.processID - b.processID);
          if(i===0) {
            $('#ganttChart > tbody:last-child').append(`<td>${queue[0].arrivalTime}</td>`);
          }
          if(queue.burstTime === 1){
            let process = queue.shift();
            process.completedTime = time+1;
            completedList.push(process);
            $('#ganttChart > tbody:last-child').append(`<td>P${process.processID}</td><td>${process.completedTime}</td>`);
          }
          else if(queue[0].burstTime>1){
            queue.burstTime--;
            let process = queue;
            $('#ganttChart > tbody:last-child').append(`<td>P${process.processID}</td><td>${time+1}</td>`);
          }
          i++;
        }
      }
      function runSRTF() {
        time++; addToQueue();
      }
  
      // Fix burst time from original input
      var TableData = [];
      $('#tblProcessList tr').each(function(row, tr) {
        TableData[row] = {
          processID: parseInt($(tr).find('td:eq(0)').text()),
          arrivalTime: parseInt($(tr).find('td:eq(1)').text()),
          burstTime: parseInt($(tr).find('td:eq(2)').text())
        };
      });
      TableData.splice(0,1);
      TableData.forEach(pTable => {
        completedList.forEach(pComp => {
          if(pTable.processID == pComp.processID){
            pComp.burstTime = pTable.burstTime;
            pComp.turnAroundTime = pComp.completedTime - pComp.arrivalTime;
            pComp.waitingTime = pComp.turnAroundTime - pComp.burstTime;
          }
        });
      });
      displayResults(completedList);
    }
  
    // Round Robin
    function roundRobin() {
      var timeQuantum = parseInt($('#timeQuantum').val(),10);
      if(isNaN(timeQuantum) || timeQuantum <= 0){
        alert('Please enter a valid time quantum');
        $('#timeQuantum').addClass('is-invalid');
        return;
      }
  
      var completedList = [], time=0, queue=[];
      while(processList.length>0 || queue.length>0){
        addToQueue();
        while(queue.length === 0){
          time++;
          addToQueue();
        }
        selectProcessForRR();
      }
  
      function addToQueue(){
        for(var i=0; i<processList.length; i++){
          if(processList[i].arrivalTime === time){
            queue.push(processList.splice(i,1)[0]);
            i--;
          }
        }
      }
      var i=0;
      function selectProcessForRR(){
        if(queue.length===0) return;
  
        if(i===0){
          $('#ganttChart > tbody:last-child').append(`<td>${queue.arrivalTime}</td>`);
        }
        var proc = queue.shift();
        if(proc.burstTime <= timeQuantum){
          time += proc.burstTime;
          proc.completedTime = time;
          completedList.push(proc);
          $('#ganttChart > tbody:last-child').append(`<td>P${proc.processID}</td><td>${proc.completedTime}</td>`);
          addToQueue();
        } else {
          time += timeQuantum;
          proc.burstTime -= timeQuantum;
          queue.push(proc);
          $('#ganttChart > tbody:last-child').append(`<td>P${proc.processID}</td><td>${time}</td>`);
          addToQueue();
        }
        i++;
      }
      displayResults(completedList);
    }
  
    // Priority Scheduling (Non-preemptive)
    function priorityScheduling() {
      var completedList = [];
      var time = 0;
      var queue = [];
  
      while (processList.length > 0 || queue.length > 0) {
        addToQueue();
        while (queue.length == 0) {
          time++;
          addToQueue();
        }
        var processToRun = selectHighestPriorityProcess();
        if (processToRun) {
          for (var i = 0; i < processToRun.burstTime; i++) {
            time++;
            addToQueue();
          }
          processToRun.completedTime = time;
          processToRun.turnAroundTime = processToRun.completedTime - processToRun.arrivalTime;
          processToRun.waitingTime = processToRun.turnAroundTime - processToRun.burstTime;
          completedList.push(processToRun);
        }
      }
  
      function addToQueue() {
        for (var i = 0; i < processList.length; i++) {
          if (processList[i].arrivalTime <= time) {
            queue.push(processList.splice(i, 1)[0]);
            i--;
          }
        }
      }
  
      function selectHighestPriorityProcess() {
        if (queue.length === 0) return null;
        queue.sort(function(a, b) {
          if (a.priority > b.priority) return -1;  // Higher priority first
          if (a.priority < b.priority) return 1;
          if (a.arrivalTime < b.arrivalTime) return -1;
          if (a.arrivalTime > b.arrivalTime) return 1;
          return 0;
        });
        return queue.shift();
      }
  
      displayResults(completedList);
    }
  
    // Common function to display results and Gantt chart
    function displayResults(completedList) {
      $('#tblResults > tbody:last-child, #ganttChart > tbody:last-child').empty();
  
      var i = 0;
      $.each(completedList, function(key, process) {
        $('#tblResults > tbody:last-child').append(
          `<tr>
            <td>${process.processID}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.completedTime}</td>
            <td>${process.waitingTime}</td>
            <td>${process.turnAroundTime}</td>
            <td>${process.priority !== undefined ? process.priority : '-'}</td>
          </tr>`
        );
  
        if (i === 0) {
          $('#ganttChart > tbody:last-child').append(`<td>${process.arrivalTime}</td>`);
        }
        $('#ganttChart > tbody:last-child').append(`<td>P${process.processID}</td><td>${process.completedTime}</td>`);
        i++;
      });
  
      var totalTurnaroundTime = 0;
      var totalWaitingTime = 0;
      var maxCompletedTime = 0;
  
      $.each(completedList, function(key, process) {
        if (process.completedTime > maxCompletedTime) {
          maxCompletedTime = process.completedTime;
        }
        totalTurnaroundTime += process.turnAroundTime;
        totalWaitingTime += process.waitingTime;
      });
  
      $('#avgTurnaroundTime').val(totalTurnaroundTime / completedList.length);
      $('#avgWaitingTime').val(totalWaitingTime / completedList.length);
      $('#throughput').val(completedList.length / maxCompletedTime);
  
      // Reset processList
      processList.length = 0;
      originProcessList.forEach(p => processList.push(Object.assign({}, p)));
    }
  });
  