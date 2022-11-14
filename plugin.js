const { readFileSync } = require('fs')
const { writeFile } = require('fs/promises')
const { join } = require('path')

module.exports = (ctx) => {
  const configLocation = process.env.CONFIG || join(__dirname, 'config.json')
  const rawConfig = readFileSync(configLocation)
  const config = JSON.parse(rawConfig)

  const namespace = ctx.plugin.module.getName()

  ctx.LPTE.on(namespace, 'request', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply,
        namespace: 'reply',
        version: 1
      },
      config: config[e.meta.sender.name]
    })
  })

  ctx.LPTE.on(namespace, 'set', async (e) => {
    if (config[e.meta.sender.name] === undefined) {
      config[e.meta.sender.name] = e.config
    } else {
      for (const key of Object.keys(e.config)) {
        config[e.meta.sender.name][key] = e.config[key]
      }
    }

    try {
      await writeFile(
        join(__dirname, './config.json'),
        JSON.stringify(config, null, 2)
      )
      ctx.log.info('config for ' + e.meta.sender.name + ' saved!')
    } catch (error) {
      ctx.log.error('config for ' + e.meta.sender.name + ` could not be saved! ${error}`)
    }
  })

  // Emit event that we're ready to operate
  ctx.LPTE.emit({
    meta: {
      type: 'plugin-status-change',
      namespace: 'lpt',
      version: 1
    },
    status: 'RUNNING'
  })
}
