var express = require('express');
var session = require('express-session');
var router = express.Router();
const Template = require('..\\db\\model.js').Template;
const Tasks = require('..\\db\\model.js').Tasks;
const Times = require('..\\db\\model.js').Times;
const Towns = require('..\\db\\model.js').Towns;
const Reports = require('..\\db\\model.js').Reports;
const Users = require('../db/model.js').Users;
const Sessions = require('../db/model.js').Sessions;
const bcrypt = require('bcrypt');


const returnManualResult = (code, res) => {

  switch (code) {
    case 102: return {
      status: -2,
      result: 'Пользователь с таким именем уже существует'
    }
    case 101: return {
      status: -2,
      result: 'Неверный логин или пароль'
    }
    case 100: return {
      status: -1,
      result: `Ошибка сервера (100): ${res}`
    }
    case 0: return {
      status: 0,
      result: res
    }
  }

}

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function (req, res, next) {

  let auth_stuff = new Buffer.from(req.headers.authorization.split(" ")[1], 'base64')
  let loginpass = auth_stuff.toString().split(":")
  try {

    (async () => {
      try {
        const user = await (Users.getHashUser([loginpass[0]]))
        if (!user) {
          return res.status(401).json(returnManualResult(101))
        }
        const match = await bcrypt.compare(loginpass[1], user.PASSWORD);
        if (!match) {
          return res.status(401).json(returnManualResult(101))
        }
        req.session.userID = user.ID
        req.session.user = loginpass[0]
        return res.status(200).json(returnManualResult(0, user.ID))
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch (err) {
    return res.status(500).json(returnManualResult(100, err))

  }
})

router.post('/registration', function (req, res, next) {

  const data = req.body
  const loginpass = new Buffer.from(data.userpass, 'base64').toString().split(":")
  try {
      (async () => {
        try {
          const user = await (Users.findUserByName([loginpass[0]]))
          if (user !== undefined) {
            return res.status(401).json(returnManualResult(102))
          }
          const hashed = await bcrypt.hash(loginpass[1], 10)
          const userId = (Users.createUser([data.fio, loginpass[0], hashed]))
          return res.status(200).json(returnManualResult(0, userId))
        }
        catch (err) {
          return res.status(500).json(returnManualResult(100, err))
        }
      })()
  }
  catch (err) {
    return res.status(500).json(returnManualResult(100, err))
  }
})


router.post('/logout', function (req, res, next) {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json(returnManualResult(100, 'ошибка удаления сессии'))
      } else {
        return res.status(200).json(returnManualResult(0, 'logout успешно'))
      }
    });
  } else {
    res.end()
  }
})

router.post('/createTemplate', function (req, res, next) {

  const newTemplate = req.body
  try {
    (async () => {
      try {
        let templateId = await (Template.create([newTemplate.title]))
        return res.status(200).json(returnManualResult(0, templateId))
        /*res.json({
          status: 0,
          result: templateId
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/deleteTemplate', function (req, res, next) {

  const templateId = req.body.id

  try {
    (async () => {
      try {
        let changes = await (Template.disactivateTask([templateId]))
        return res.status(200).json(returnManualResult(0, changes))
        /*res.json({
          status: 0,
          result: changes
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/getAllTemplates', function (req, res, next) {
  try {
    (async () => {
      try {
        let tasks = await (Template.getAllTemplates())
        //console.log(tasks)
        return res.status(200).json(returnManualResult(0, tasks))
        /*res.json({
          status: 0,
          result: tasks
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/getAllTowns', function (req, res, next) {
  try {
    (async () => {
      try {
        let towns = await (Towns.getAllTowns())
        //console.log(tasks)
        return res.status(200).json(returnManualResult(0, towns))
        /*res.json({
          status: 0,
          result: towns
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/getAllTasks', function (req, res, next) {

  const curDate = req.body.curDate
  try {
    (async () => {
      try {
        let tasks = await (Tasks.getAllTasks([curDate, req.session.userID]))
        return res.status(200).json(returnManualResult(0, tasks))
        /*res.json({
          status: 0,
          result: tasks
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/reportTasksDays', function (req, res, next) {

  const dates = req.body
  try {
    (async () => {
      try {
        let report = await (Reports.reportTasksDays([dates.reportDateStart, dates.reportDateEnd, req.session.userID]))
        return res.status(200).json(returnManualResult(0, report))
        /*res.json({
          status: 0,
          result: report
        })*/
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

router.post('/createNewTask', function (req, res, next) {

  const newTask = req.body
  let returnRec = {}
  try {
    (async () => {
      try {
        /*await (Times.close([newTask.datestart]))
        let pausedTask = await (Tasks.getCurrectActiveTask([req.session.userID]))
        await (Tasks.pauseCurrentAcive([req.session.userID]))
        if (pausedTask !== undefined)
          returnRec = await (Times.getTaskDuration([pausedTask.ID]))*/
        // get prevues active task and pause it
        let preveusTask = await (Tasks.getCurrectActiveTask([req.session.userID]))
        await (Tasks.pauseCurrentAcive([req.session.userID]))
        // get duration of preveus task
        if (preveusTask !== undefined) {
          // set endtime for preveus task
          await (Times.close([newTask.datestart, preveusTask.ID]))
          returnRec = await (Times.getTaskDuration([preveusTask.ID]))
        }
        
        let taskId = await (Tasks.create([newTask.id, req.session.userID]))
        await (Times.create([taskId, newTask.datestart]))
        res.json({
          status: 0,
          result: taskId,
          duration: returnRec.duration
        })
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
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
            await (Times.close([currentTask.date, currentTask.id]))
            returnRec = await (Times.getTaskDuration([currentTask.id]))
            break
          case 'play':
            // get prevues active task and pause it
            let preveusTask = await (Tasks.getCurrectActiveTask([req.session.userID]))
            await (Tasks.pauseCurrentAcive([req.session.userID]))
            // get duration of preveus task
            if (preveusTask !== undefined) {
              // set endtime for preveus task
              await (Times.close([currentTask.date, preveusTask.ID]))
              returnRec = await (Times.getTaskDuration([preveusTask.ID]))
            }
            // start cur task
            changedTaskId = await (Tasks.playById([currentTask.id]))
            // set time start for current task
            await (Times.create([currentTask.id, currentTask.date]))
            break
          case 'close':
            changedTaskId = await (Tasks.closeById([currentTask.id]))
            await (Times.close([currentTask.date, currentTask.id]))
            returnRec = await (Times.getTaskDuration([currentTask.id]))
            break
          case 'save':
            //console.log(`id = ${currentTask.id} desc = ${currentTask.description}`)
            returnRec = await (Tasks.saveDescription([currentTask.description, currentTask.town_id, currentTask.id]))
            break
        }

        //console.log(returnRec.duration)
        res.json({
          status: 0,
          result: changedTaskId,
          duration: returnRec.duration
        })
      }
      catch (err) {
        return res.status(500).json(returnManualResult(100, err))
      }
    })()
  }
  catch {
    return res.status(500).json(returnManualResult(100, err))
  }
});

module.exports = router;
