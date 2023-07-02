import fs from 'fs'
import dayjs from 'dayjs'
import { isArray } from 'util'

/*
 "ID": 66,
      "post_author": 1,
      "post_date": "06/14/2005",
      "post_date_gmt": "06/14/2005",
      "post_content": "This is the first post on the Generator.x blog. Be sure to read the [introduction->generatorx-introduction] to the Generator.x project.rnrnOver the next few months leading up to the [conference->generatorx-conference] and the opening of the first incarnation of the [exhibition->generatorx-exhibition], we will be posting articles related to generative art and computational design. This blog will remain online and active for the duration of the project. Currently, the exhibition is set to tour until the end of 2007.rnrnThanks to [Products of Play->http://www.playpuppy.com/] for design. This blog is published in [WordPress->http://www.wordpress.org/], a free blog software with comprehensive features. ",
      "post_title": "Generator.x blog goes live",
      "post_category": 0,
      "post_status": "publish",
      "comment_status": "open",
      "ping_status": "open",
      "post_name": "generatorx-blog-goes-live",
      "post_modified": "06/21/2005",
      "post_modified_gmt": "06/21/2005",
      "post_parent": 0,
      "guid": "http://www.generatorx.no/?p=66",
      "menu_order": 0,
      "comment_count": 0
*/

export function fieldNames(fields) {
  if (!fields) return []

  let fieldNames = fields.map((f) => {
    return f.name
  })

  console.log(fields.length, 'fields', fieldNames.join(','))
}

export function parseSQLJSON(file) {
  let rawdata = fs.readFileSync(file)
  let data = JSON.parse(rawdata)
  debug('\nreading file\n')

  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) debug(key, data[key].length)
    else debug(key, data[key])
  })

  data['wp_posts'].forEach((el) => {
    if (el.ID < 30) {
      fixSmartLinks(el.post_content)
    }
  })
}

const linkPat = /[^\[]*\[(.*?)\][^\[]*/g
function fixSmartLinks(text) {
  let links = text.matchAll(linkPat)
  let linksNew = []
  if (links) debug(JSON.stringify(links))

  if (links)
    for (const lnk of links) {
      let href, txt
      let pos = lnk.indexOf('->')
      if (pos > -1) {
        txt = lnk.substring(1, pos)
        href = lnk.substring(pos + 2, lnk.length - 1)
        linksNew.push(`<a href="${href}">${txt}</a>`)
      }
    }
  //   debug(JSON.stringify(links))
}

export function debug(...arg) {
  console.log(new dayjs().format('hhMMss'), ...arg)
}
export default parseSQLJSON
