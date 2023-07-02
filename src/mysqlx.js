import mysqlx from '@mysql/xdevapi'

mysqlx.getSession('mysqlx://root:root@localhost:10005/local').then((session) => {
  console.log(session.inspect()) // { user: 'root', host: 'localhost', port: 33060 }
})
