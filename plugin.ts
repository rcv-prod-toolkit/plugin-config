import type { PluginContext } from '@rcv-prod-toolkit/types'
import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

module.exports = (ctx: PluginContext) => {
  const configLocation =
    process.env.CONFIG || join(__dirname, '..', 'config.json')
  const rawConfig = readFileSync(configLocation)
  const config = JSON.parse(rawConfig.toString())

  const namespace = ctx.plugin.module.getName()

  ctx.LPTE.on(namespace, 'request', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      config: config[e.meta.sender!.name]
    })
  })

  ctx.LPTE.on(namespace, 'set', async (e) => {
    if (config[e.meta.sender!.name] === undefined) {
      config[e.meta.sender!.name] = e.config
    } else {
      for (const key of Object.keys(e.config)) {
        config[e.meta.sender!.name][key] = e.config[key]
      }
    }

    try {
      await writeFile(configLocation, JSON.stringify(config, null, 2))
      ctx.log.info('config for ' + e.meta.sender!.name + ' saved!')
    } catch (error) {
      ctx.log.error(
        'config for ' + e.meta.sender!.name + ` could not be saved! ${error}`
      )
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
