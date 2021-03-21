
const sqlite3 = require('sqlite3').verbose()
const dbName = 'servicedesk.sqlite'
const db = new sqlite3.Database(__dirname + dbName);
db.serialize(() => {
    const createTemplate = 'CREATE TABLE IF NOT EXISTS TASKS_TEMPLATES (TEMPLATE_ID integer primary key, TEMPLATE_TITLE text, ACTIVE integer)'
    const createTasks = 'CREATE TABLE IF NOT EXISTS TASKS (ID integer primary key, TEMPLATE_ID integer, STATUS integer, DESCRIPTION text, TOWN_ID integer)'
    const createTimes = 'CREATE TABLE IF NOT EXISTS TIMES (ID integer primary key, TASKID integer, DATESTART text, DATEEND text)'
    const createTowns = 'CREATE TABLE IF NOT EXISTS TOWNS (ID integer primary key, TOWN_TITLE text, ISFILIAL integer)'
    const createUsers = 'CREATE TABLE IF NOT EXISTS USERS (ID integer primary key, FIO text, USERNAME text, PASSWORD text, ROLE integer)'
    const createSessions = 'CREATE TABLE IF NOT EXISTS SESSIONS (ID integer primary key, USERID integer, SESSIONID text)'
    db.run(createTemplate)
    db.run(createTasks)
    db.run(createTimes)
    db.run(createTowns)
    db.run(createUsers)
    db.run(createSessions)
})

const getRecord = (sql, data) => {
    return new Promise((resolve, reject) => {
        db.get(sql, ...data, function (err, row) {
            if (err)
                reject(err.message)
            else {
                resolve(row)
            }

        })
    })
}

const updateById = (sql, data) => {
    return new Promise((resolve, reject) => {
        db.run(sql, ...data, function (err, change) {
            if (err)
                reject(err.message)
            else
                resolve(this.changes)

        })
    })
}

const runSQL = (sql) => {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err)
                reject(err.message)
            else
                resolve(this.changes)

        })
    })
}

const createNewRecord = (sql, data) => {
    return new Promise((resolve, reject) => {
        db.run(sql, ...data, function (err) {
            if (err)
                reject(err.message)
            else
                resolve(this.lastID)

        })
    })
}

const selectAll = (sql, data) => {
    //console.log(`1 ${data}`)
    return new Promise((resolve, reject) => {
        db.all(sql, ...data, (err, rows) => {
            if (err)
                reject(err.message)
            else {
                //rows.forEach(item => console.log(item))
                resolve(rows)
            }
        })
    })
}

class Users {

    static findUserByNAme(data) {
        const sql = `select ID from USERS where USERNAME = ? `
        return getRecord(sql, data)
    }

    static getHashUser(data) {
        console.log('3')
        console.log(data)
        const sql = `select PASSWORD from USERS where USERNAME = ? and ROLE > 0`
        return getRecord(sql, data)
    }

    static createUser(data) {
        const sql = `insert into USERS (FIO, USERNAME, PASSWORD, ROLE) values (?, ?, ?, -1)`
        return createNewRecord(sql, data)
    }
}

class Sessions {

}

class Template {

    static create(data) {
        const sql = `insert into TASKS_TEMPLATES (TEMPLATE_TITLE, ACTIVE) values (?, 1)`
        return createNewRecord(sql, data)
    }

    static getAllTemplates() {
        const sql = `select TEMPLATE_ID as id, TEMPLATE_TITLE as title from TASKS_TEMPLATES where ACTIVE = 1`
        return selectAll(sql, [])
    }

    static disactivateTask(data) {
        const sql = `update TASKS_TEMPLATES set ACTIVE = 0 where TEMPLATE_ID = ?`
        return updateById(sql, data)
    }

}


class Tasks {

    static create(data) {
        const sql = `insert into TASKS (TEMPLATE_ID, STATUS, DESCRIPTION) values (?, 2, '')`
        return createNewRecord(sql, data)
    }

    static getAllTasks(data) {
        const sql = `   select  t1.ID as taskId,
                                t2.TEMPLATE_TITLE as title,
                                strftime('%H:%M:%S', t3.DATESTART) as time_start,
                                sum((strftime('%s',t3.DATEEND) - strftime('%s',t3.DATESTART))) as duration,
                                t1.STATUS as status,
                                t1.DESCRIPTION as description,
                                ifnull(t1.TOWN_ID,-1) as town_id,
                                t4.TOWN_TITLE as town_title
                        from TASKS as t1
                        join TASKS_TEMPLATES as t2 on t1.TEMPLATE_ID = t2.TEMPLATE_ID
                        join TIMES as t3 on t3.TASKID = t1.ID
                        left join TOWNS as t4 on t1.TOWN_ID = t4.ID
                        where t2.ACTIVE = 1 and date(t3.DATESTART) = date(?)
                        group by t1.ID, t2.TEMPLATE_ID, t2.TEMPLATE_TITLE
                        ORDER BY t1.STATUS desc, t3.DATESTART desc`
        return selectAll(sql, data)
    }

    static pauseById(data) {
        const sql = `update TASKS set STATUS = 1 where ID = ?`
        return updateById(sql, data)
    }

    static playById(data) {
        const sql = `update TASKS set STATUS = 2 where ID = ?`
        return updateById(sql, data)
    }

    static getCurrectActiveTask() {
        const sql = 'select ID from TASKS where STATUS = 2'
        return getRecord(sql, [])
    }

    static pauseCurrentAcive() {
        const sql = `update TASKS set STATUS = 1 where STATUS = 2`
        return runSQL(sql)
    }

    static closeById(data) {
        const sql = `update TASKS set STATUS = 0 where ID = ?`
        return updateById(sql, data)
    }

    static saveDescription(data) {
        const sql = `update TASKS set DESCRIPTION = ?, TOWN_ID = ? where ID = ?`
        return updateById(sql, data)
    }

}

class Times {

    static create(data) {
        const sql = `INSERT INTO TIMES (TASKID, DATESTART) VALUES (?,?)`
        return createNewRecord(sql, data)
    }

    static close(data) {
        const sql = `update TIMES set DATEEND = ? where DATEEND is null`
        return updateById(sql, data)
    }

    static getTaskDuration(data) {
        const sql = `select sum((strftime('%s',DATEEND) - strftime('%s',DATESTART))) as duration 
                    from TIMES 
                    where TASKID = ?`
        return getRecord(sql, data)
    }

}

class Towns {

    static getAllTowns() {
        const sql = `select ID as id, TOWN_TITLE as town_title, ISFILIAL as isfilial from TOWNS`
        return selectAll(sql, [])
    }
}

class Reports {

    static reportTasksDays(data) {
        const sql = `   select  t2.TEMPLATE_TITLE as template_title, 
                                ifnull(t4.TOWN_TITLE,'') as town_title, 
                                t1.DESCRIPTION as description, 
                                min(t3.DATESTART) as datestart, 
                                sum((strftime('%s',t3.DATEEND) - strftime('%s',t3.DATESTART))) as duration
                        from TASKS as t1
                        join TASKS_TEMPLATES as t2 on t2.TEMPLATE_ID = t1.TEMPLATE_ID
                        join TIMES as t3 on t3.TASKID = t1.ID
                        left join TOWNS as t4 on t1.TOWN_ID = t4.ID
                        where t3.DATESTART between ? and ?
                        group by t2.TEMPLATE_ID, t2.TEMPLATE_TITLE, t1.ID, t4.TOWN_TITLE, t1.DESCRIPTION
                        order by datestart`
        return selectAll(sql, data)

    }
}

module.exports = db
module.exports.Template = Template
module.exports.Tasks = Tasks
module.exports.Times = Times
module.exports.Towns = Towns
module.exports.Reports = Reports
module.exports.Users = Users
module.exports.Sessions = Sessions
