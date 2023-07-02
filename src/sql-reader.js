import fs from 'fs'
import readline from 'readline'

const WP_POSTS_INSERT = 'INSERT INTO `wp_posts`'

export const sqlReader = (file) => {
  const fileStream = fs.createReadStream(file)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let section = ''
  let wp_posts_header
  const wp_posts = []
  let lineCnt = 0

  rl.on('line', (line) => {
    if (line.startsWith(WP_POSTS_INSERT)) {
      if (!wp_posts_header) {
        wp_posts_header = getHeader(line)
        section = 'wp_posts'
      }

      if (section === 'wp_posts') wp_posts.push(line.substring(line.indexOf('(')))
      console.log(lineCnt, wp_posts.length, wp_posts[wp_posts.length - 1])
    }
    lineCnt++
  })

  rl.on('close', () => {
    console.log(`Finished reading the file. ${lineCnt} lines.`)
  })
}

function getHeader(line) {
  line = line.substring(line.indexOf('(') + 1)
  line = line.substring(0, line.indexOf(')')).replaceAll('`', '')
  let header = line.split(', ')

  console.log('getHeader', header)
  return header
}

export default sqlReader
