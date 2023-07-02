import mariadb from 'mariadb'
import mysql from 'mysql2/promise'
import dayjs from 'dayjs'
import fs from 'fs'
import { MYSQL_CONFIG } from './mysql-config.js'
import { fieldNames, fixSmartLinks } from './sql-tools.js'

let q = 'SELECT * FROM `wp_posts`'

function noNewLines(str) {
  return str.replaceAll('\n', '\\n')
}

function toDate(day) {
  // return new dayjs(day).format('YYYY-MM-DD MMM')
  return new dayjs(day).format('DD MMM, YYYY')
}

async function processPosts(conn) {
  const [rows, fields] = await conn.query('SELECT * FROM `wp_posts`')
  console.log(rows[10])
  fixSmartLinks(rows[10].post_content)
}

// `wp_postmeta` (`meta_id`, `post_id`, `meta_key`, `meta_value`)
async function getPostmeta(conn) {
  const metaTypes = []
  const [rows, fields] = await conn.query('SELECT * FROM `wp_postmeta`')

  const rowsEdit = rows.filter((r) => {
    if (r.meta_key.startsWith('_utw')) return false

    if (metaTypes.indexOf(r.meta_key) < 0) metaTypes.push(r.meta_key)
    r.meta_value = noNewLines(r.meta_value)
    return true
  })

  const postMap = {}
  console.log('metaTypes', metaTypes)

  rowsEdit.map((row) => {
    if (!postMap[row.post_id]) postMap[row.post_id] = []
    postMap[row.post_id].push({ meta_id: row.meta_id, meta_key: row.meta_key, meta_value: row.meta_value })
    console.log(`${row.meta_id}\t${row.post_id}\t${row.meta_key}\t${row.meta_value}\t`)
  })

  fs.writeFileSync('postMetaMap.json', JSON.stringify(postMap), 'utf-8')

  return true
}

async function main() {
  let conn

  console.log('\n-- main()')
  await mysql.createConnection(MYSQL_CONFIG).then((res) => {
    conn = res
    console.log('got it', conn.config)
  })

  console.log('\n-- connect() ' + (conn ? 'true' : 'false'))
  conn.connect((err) => {
    if (err) console.error(err)
    else console.log(conn != undefined)
  })

  if (processPosts(conn)) return

  const [rows, fields] = await conn.query(q)
  if (fields) {
    let fieldNames = fields.map((f) => {
      return f.name + (f.name === 'post_content' ? ' = ' + typeof f['_buf'] : '')
    })

    console.log('fields', fields.length, 'rows', rows.length)
    console.log()
    console.log('fields', fieldNames.join(','))
    rows.map((post) => {
      if (post.post_content !== 'publish') {
        let txt = post.post_content.toString()

        if (typeof txt === 'string') {
          txt = txt.replace(/<\/?[^>]+(>|$)/g, '')
          txt = txt.replaceAll('\n', '')
          if (txt.length > 80) txt = `\n[${txt.length}]\t${txt.substring(0, 120)}\n`
        }
        console.log(`${post.ID}\t${toDate(post.post_date)}\t${post.post_title}` + `\t${txt}`)
      }
    })
  }

  // if (conn)
  //   conn.query(q).then((err, results, fields) => {
  //     if (err) console.error(err)
  //     else {
  // results.map((post) => {
  //   console.log(`${post.ID}\t${toDate(post.post_data)}\t${post.title}`)
  // })
  // let fieldNames = fields.map((f) => {
  //   return f.name
  // })
  // console.log('fields', fieldNames)
  // console.log(results.length)
  //   }
  // })
  // conn.query(q).then(([rows, fields]) => console.log(rows[0].foo))
  console.log('\n-- done')
}

main().then(() => {
  console.log('EXIT')
})

// mysql
//   .createConnection({
//     // host: '127.0.0.1',
//     host: 'localhost:888,
//     port: '8889',
//     user: 'root',
//     password: '',
//     database: 'wp',
//   })

// console.log(conn)

// simple query
// connection.query(q, function (err, results, fields) {
//   console.log(results) // results contains rows returned by server
//   console.log(fields) // fields contains extra meta data about results, if available
// })
/*const pool = mariadb.createPool({
     host: 'localhost',
     database: 'local',
     port:10006,
     user:'root', 
     password: 'root',
     connectionLimit: 5
});

console.log('pool',pool);

pool.getConnection()
    .then(conn => {
    console.log('Connection',conn)
      conn.query(q)
        .then((rows) => {
          console.log(rows); //[ {val: 1}, meta: ... ]
          //Table must have been created before 
          // " CREATE TABLE myTable (id int, val varchar(255)) "
        //   return conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
        })
        .then((res) => {
          console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
          conn.end();
        })
        .catch(err => {
          //handle error
          console.log(err); 
          conn.end();
        })
        
    }).catch(err => {
      console.log('Barf',err)
    });
*/

// import { Sequelize } from 'sequelize'

// let sequelize

// // mysql://my_user_name:my_password@127.0.0.1:optional_port/database_name?socketPath=/full/absolute/path/to/socket"

// async function conn() {
//   console.log('calling')

//   sequelize = new Sequelize('mysql://root:root@localhost', {
//     host: 'localhost',
//     port: 8889,
//     logging: console.log,
//     database: 'wp',
//     dialect: 'mysql', //'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' .
//     dialectModule: mysql,

//     // you can also pass any dialect options to the underlying dialect library
//     // - default is empty
//     // - currently supported: 'mysql', 'postgres', 'mssql'
//     dialectOptions: {
//       socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',
//     },
//     sync: { force: true },
//   })

//   console.log(sequelize ? 'defined' : 'undefined')

//   try {
//     // [results, metadata] = await sequelize.query(q)
//     const results = await sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
//     console.log(results)
//     // sequelize.authenticate().then((response) => {
//     //   console.log('Authenticate:', response)
//     // })
//   } catch (error) {
//     console.error('Unable to connect to the database:', error)
//   }
//   console.log('conn done')
// }

// conn()

// import { QueryTypes } from 'sequelize'
// sequelize.query('SELECT * FROM `wp_posts`', { raw: true }).then((res) => {
//   console.log(res)
// })

// let start = Date.now()
// let last = start

// while (sequelize.state !== 'connected') {
//   let t = Date.now() - last
//   if (t > 2000) {
//     console.log(Date.now() - start, 'Connected?', sequelize.state)
//     last = Date.now()
//   }
// }

/*
var con = mysql.createConnection({
  host: 'localhost',
  localAddress: 'localhost',
  port: '8889',
  user: 'root',
  password: 'root',
  database: 'wp',
  connectTimeout: 1000,
  debug: true,
})

function progress() {
  console.log(Date.now(), con.state)
  setTimeout(progress, 5000)
}
setTimeout(progress, 5000)

con.connect(function (err) {
  if (err) throw err
  console.log('Connected!')
})

//   (err) => {
//   console.error(err)
//   if (err) throw err
// }

// });

console.log('Connected?', con.state, con)

let start = Date.now()
let last = start

while (con.state !== 'connected') {
  let t = Date.now() - last
  if (t > 2000) {
    console.log(Date.now() - start, 'Connected?', con.state, con.statistics(), con.mysql)
    last = Date.now()
  }
}
// console.log('query: ', q)
// const res = con.query({ sql: q, timeout: 10000 }, function (err, results) {
//   if (err) throw err
//   console.log(results)
// })

con.query(q, function (error, results, fields) {
  if (error) throw error
  console.log(results)
  console.log('-------\n', fields)
})

con.end()*/
