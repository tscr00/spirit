import { context, jsonloader, xpath, debug } from '../utils'
import { Groups, Group } from '../group'

/**
 * Get transform object from container
 * @param {HTMLElement} container
 * @param {object} tl
 * @returns {HTMLElement|object}
 */
function getTransformObject(container, tl) {
  let to

  if (tl.type !== 'object') {
    if (tl.id) {
      to = container.querySelector(`[data-spirit-id="${tl.id}"]`)

      if (!to && !tl.path) {
        if (debug) {
          console.group('Unable to resolve element by [data-spirit-id] attribute')
          console.warn(`Timeline: `, tl)
          console.groupEnd()
        }
        throw new Error(`Cannot find element with [data-spirit-id="${tl.id}"]`)
      }
    }

    if (!to && tl.path) {
      if (container === document.body) {
        container = undefined
      }
      to = xpath.getElement(tl.path, container)

      if (!to) {
        if (debug) {
          console.group('Unable to resolve element by path expression')
          console.warn(`Timeline: `, tl)
          console.groupEnd()
        }
        throw new Error(`Cannot find element with path expression ${tl.path}`)
      }
    }

    if (!to) {
      if (debug) {
        console.group('Unable to resolve element')
        console.warn(`Timeline: `, tl)
        console.groupEnd()
      }
      throw new Error('Cannot find element.')
    }
  }

  return to
}

/**
 * Parse groups
 * @param {object|Array} data to import
 * @param {HTMLElement} element root element
 * @returns Groups
 */
export function create(data, element = undefined) {
  if (!context.isBrowser()) {
    throw new Error('Invalid context. spirit.create() can only be executed in browser.')
  }

  // ensure root element
  if (!(element instanceof window.HTMLElement)) {
    element = document.body
  }

  if (!Array.isArray(data) && data['groups'] && Array.isArray(data['groups'])) {
    data = data['groups']
  }

  if (!Array.isArray(data)) {
    data = [data]
  }

  const groups = new Groups(element, [])

  data.forEach(g => {
    const d = {
      name: g.name,
      fps: g.fps,
      timelines: []
    }

    g.timelines.forEach(tl => {
      d.timelines.push({
        transformObject: getTransformObject(element, tl),
        transitions: tl.transitions,
        label: (tl.label && typeof tl.label === 'string' && tl.label.trim() !== '') ? tl.label : tl.path
      })
    })

    const group = new Group(d)
    groups.add(group)
  })

  return groups
}

/**
 * Load data and apply it to element
 * @param {string} url
 * @param {HTMLElement} element
 * @returns {Promise}
 */
export function load(url, element = undefined) {
  if (!context.isBrowser()) {
    return Promise.reject(new Error('Invalid context: spirit.load() can only be executed in browser.'))
  }

  return jsonloader(url).then(data => create(data, element))
}
