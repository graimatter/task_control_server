var express = require('express');
var router = express.Router();
const Template = require('..\\db\\model.js').Template;
const Tasks = require('..\\db\\model.js').Tasks;
const Times = require('..\\db\\model.js').Times;
const Towns = require('..\\db\\model.js').Towns;
const Reports = require('..\\db\\model.js').Reports;

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/createTemplate', function (req, res, next) {

  const newTemplate = req.body
  try {
    (async () => {
      try {
        let templateId = await (Template.create([newTemplate.title]))
        res.json({
          status: 0,
          result: templateId
        })
      }
      catch (err) {
        console.log(`**** ${err} ****`)
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/deleteTemplate', function (req, res, next) {

  const templateId = req.body.id

  try {
    (async () => {
      try {
        let changes = await (Template.disactivateTask([templateId]))
        res.json({
          status: 0,
          result: changes
        })
      }
      catch (err) {
        console.log(`**** ${err} ****`)
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/getAllTemplates', function (req, res, next) {
  try {
    (async () => {
      try {
        let tasks = await (Template.getAllTemplates())
        //console.log(tasks)
        res.json({
          status: 0,
          result: tasks
        })
      }
      catch (err) {
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/getAllTowns', function (req, res, next) {
  try {
    (async () => {
      try {
        let towns = await (Towns.getAllTowns())
        //console.log(tasks)
        res.json({
          status: 0,
          result: towns
        })
      }
      catch (err) {
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/getAllTasks', function (req, res, next) {

  const curDate = req.body.curDate
  try {
    (async () => {
      try {
        let tasks = await (Tasks.getAllTasks([curDate]))
        res.json({
          status: 0,
          result: tasks
        })
      }
      catch (err) {
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/reportTasksDays', function (req, res, next) {

  const dates = req.body
  console.log('**')
  try {
    (async () => {
      try {
        let report = await (Reports.reportTasksDays([dates.reportDateStart, dates.reportDateEnd]))
        res.json({
          status: 0,
          result: report
        })
      }
      catch (err) {
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/createNewTask', function (req, res, next) {

  const newTask = req.body
  let returnRec = {}
  try {
    (async () => {
      try {
        await (Times.close([newTask.datestart]))
        let pausedTask = await (Tasks.getCurrectActiveTask())
        await (Tasks.pauseCurrentAcive())
        if (pausedTask !== undefined)
          returnRec = await (Times.getTaskDuration([pausedTask.ID]))
        let taskId = await (Tasks.create([newTask.id]))
        await (Times.create([taskId, newTask.datestart]))
        res.json({
          status: 0,
          result: taskId,
          duration: returnRec.duration
        })
      }
      catch (err) {
        console.log(`**** ${err} ****`)
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

router.post('/controllTask', function (req, res, next) {

  const currentTask = req.body
  //console.log(currentTask)
  //console.log(currentTask)
  try {
    (async () => {
      try {
        let changedTaskId = -1
        let returnRec = {}
        switch (currentTask.action) {
          case 'pause':
            changedTaskId = await (Tasks.pauseById([currentTask.id]))
            await (Times.close([currentTask.date]))
            returnRec = await (Times.getTaskDuration([currentTask.id]))
            break
          case 'play':
            // set endtime for preveus task
            await (Times.close([currentTask.date]))
            // get prevues active task and pause it
            let preveusTask = await (Tasks.getCurrectActiveTask())
            await (Tasks.pauseCurrentAcive())
            // get duration of preveus task
            if (preveusTask !== undefined)
              returnRec = await (Times.getTaskDuration([preveusTask.ID]))
            // start cur task
            changedTaskId = await (Tasks.playById([currentTask.id]))
            // set time start for current task
            await (Times.create([currentTask.id, currentTask.date]))
            break
          case 'close':
            changedTaskId = await (Tasks.closeById([currentTask.id]))
            await (Times.close([currentTask.date]))
            returnRec = await (Times.getTaskDuration([currentTask.id]))
            break
          case 'save':
            //console.log(`id = ${currentTask.id} desc = ${currentTask.description}`)
            returnRec = await (Tasks.saveDescription([currentTask.description, currentTask.town_id, currentTask.id]))
            break
        }

        console.log(returnRec.duration)
        res.json({
          status: 0,
          result: changedTaskId,
          duration: returnRec.duration
        })
      }
      catch (err) {
        console.log(`**** ${err} ****`)
        res.json({
          status: -1,
          result: err
        })
      }
    })()
  }
  catch {
    res.json({
      status: -1,
      result: 'server error'
    })
  }
});

module.exports = router;
