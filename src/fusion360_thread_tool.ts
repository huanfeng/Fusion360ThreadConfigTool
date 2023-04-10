import { XMLParser, XMLBuilder } from 'fast-xml-parser'

type XmlConfig = {
  name: string
  offsets: number[]
  handleInternel: boolean
  handleExternal: boolean
  reserveOriginal: boolean
}

const GENDER_EXT = 'external'
const GENDER_INT = 'internal'

type Thread = {
  Gender: string // 类型: external 外螺纹, internal 内螺纹
  Class: string // 螺纹配合等级
  MajorDia: number // 大径
  PitchDia: number // 螺距
  MinorDia: number // 小径
  TapDrill: number | null // 下孔径
}

type Designation = {
  ThreadDesignation: string
  CTD: string
  Pitch: number
  Thread: Thread[]
}

type ThreadSize = {
  Size: number
  Designation: Designation[] | Designation
}

function patchDesignation(d: Designation, size: number, cfg: XmlConfig) {
  const append = [] as Thread[]
  d.Thread.forEach((t) => {
    // console.log(`Thread: ${JSON.stringify(t)}`)
    if (t.Gender == GENDER_EXT && cfg.handleExternal) {
      cfg.offsets.forEach((offset) => {
        const newT = { ...t }
        newT.Class = newT.Class + '@' + (offset >= 0 ? '+' + offset : '-' + offset)
        newT.MajorDia += offset
        newT.MinorDia += offset
        newT.PitchDia += offset
        append.push(newT)
      })
    } else if (t.Gender == GENDER_INT && cfg.handleInternel) {
      cfg.offsets.forEach((offset) => {
        const newT = { ...t }
        newT.Class = newT.Class + '@' + (offset >= 0 ? '+' + offset : '-' + offset)
        newT.MajorDia += offset
        newT.MinorDia += offset
        newT.PitchDia += offset
        append.push(newT)
      })
    }
  })
  // Clear orig
  if (!cfg.reserveOriginal) {
    d.Thread = []
  }
  d.Thread.push(...append)
}

function generalXml(input: string, cfg: XmlConfig): string {
  console.log(`generalXml cfg: ${JSON.stringify(cfg)}`)

  const parser = new XMLParser({
    parseAttributeValue: true, // 需要配置这个以解析 <?xml version="" encoding="" ?> 的信息
    ignoreAttributes: false
  })
  let jobj = parser.parse(input)
  // console.log(`jobj: ${JSON.stringify(jobj)}`)

  const root = jobj.ThreadType
  root.Name = cfg.name
  root.CustomName = cfg.name
  const sizeList = root.ThreadSize as any[]
  sizeList.forEach((i, index) => {
    const it = i as ThreadSize
    console.log(`SizeList[${index}]: size=${it.Size}`)
    // console.log(`size: ${it.Size}`)
    if (it.Designation instanceof Array) {
      it.Designation.forEach((d) => {
        patchDesignation(d, i.Size, cfg)
      })
    } else {
      patchDesignation(it.Designation, i.Size, cfg)
    }
  })

  // Remove empty thread size
  for (let i = sizeList.length - 1; i >= 0; i--) {
    const d = sizeList[i]
    if (d.Designation instanceof Array) {
      let allCount = 0
      for (let j = d.Designation.length - 1; j >= 0; j--) {
        const t = d.Designation[j]
        allCount += t.Thread.length
      }
      if (allCount == 0) {
        sizeList.splice(i, 1)
      }
    } else {
      if (d.Designation.Thread.length <= 0) {
        sizeList.splice(i, 1)
      }
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true
  })
  // Fix xml version
  jobj['?xml']['@_version'] = jobj['?xml']['@_version'].toFixed(1)
  let xml = builder.build(jobj)
  // console.log(`xml: ${xml}`)
  return xml
}

export { generalXml, type XmlConfig }
