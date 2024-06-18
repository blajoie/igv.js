import * as DOMUtils from "../ui/utils/dom-utils.js"
import * as UIUtils from "../ui/utils/ui-utils.js"
import {isSecureContext} from "../util/igvUtils.js"
import {createBlatTrack} from "../blat/blatTrack.js"

const maxSequenceSize = 100000
const maxBlatSize = 25000

class ROIMenu {
    constructor(browser, parent) {

        this.browser = browser

        // container
        this.container = DOMUtils.div({class: 'igv-roi-menu'})
        parent.appendChild(this.container)

        // header
        const header = DOMUtils.div()
        this.container.appendChild(header)

        UIUtils.attachDialogCloseHandlerWithParent(header, () => this.container.style.display = 'none')

        // body
        this.body = DOMUtils.div()
        this.container.appendChild(this.body)

        this.container.style.display = 'none'

    }

    async present(x, y, roiManager, columnContainer, regionElement) {

        removeAllChildNodes(this.body)

        const feature = await this.browser.roiManager.findUserDefinedRegionWithKey(regionElement.dataset.region)

        // Description Copy
        const _description_copy_ = DOMUtils.div()
        this.body.appendChild(_description_copy_)

        const placeholder = 'Description'
        const str = (feature.name || placeholder)

        _description_copy_.innerText = str
        _description_copy_.setAttribute('title', str)
        placeholder === str ? _description_copy_.classList.add('igv-roi-placeholder') : _description_copy_.classList.remove('igv-roi-placeholder')


        // Set Description
        const description = DOMUtils.div()
        this.body.appendChild(description)
        description.innerText = 'Set Description'

        description.addEventListener('click', event => {

            event.stopPropagation()

            this.container.style.display = 'none'

            const callback = () => {

                const value = this.browser.inputDialog.value || ''
                feature.name = value.trim()

                this.container.style.display = 'none'

                this.browser.roiManager.repaintTable()
            }

            const config =
                {
                    label: 'Description',
                    value: (feature.name || ''),
                    callback
                }

            this.browser.inputDialog.present(config, event)

        })

        // sequence

        // copy
        if (isSecureContext() && feature.end - feature.start < maxBlatSize) {
            const copySequence = DOMUtils.div()
            this.body.appendChild(copySequence)
            copySequence.innerText = 'Copy reference sequence'
            copySequence.addEventListener('click', async () => {
                this.container.style.display = 'none'
                let sequence = await this.browser.genome.getSequence(feature.chr, feature.start, feature.end)
                if (!sequence) {
                    sequence = "Unknown sequence"
                }
                try {
                    await navigator.clipboard.writeText(sequence)
                } catch (e) {
                    console.error(e)
                    this.browser.alert.present(`error copying sequence to clipboard ${e}`)
                }
            })
        }

        if (feature.end - feature.start <= maxSequenceSize) {
            // blat
            const blatSequence = DOMUtils.div()
            this.body.appendChild(blatSequence)
            blatSequence.innerText = 'BLAT reference sequence'
            blatSequence.addEventListener('click', async () => {
                this.container.style.display = 'none'
                const {chr, start, end} = feature
                let sequence = await this.browser.genome.getSequence(chr, start, end)
                if (sequence) {
                    const name = `blat: ${chr}:${start + 1}-${end}`
                    const title = `blat: ${chr}:${start + 1}-${end}`
                    createBlatTrack({sequence, browser: this.browser, name, title})
                }
            })
        }


        // items.push({
        //     label: 'BLAT read sequence',
        //     click: async () => {
        //         let sequence = await this.browser.genome.getSequence(chr, start, end)
        //         if (sequence) {
        //             if (this.reversed) {
        //                 sequence = reverseComplementSequence(sequence)
        //             }
        //             const name = `blat: ${chr}:${start + 1}-${end}`
        //             const title = `blat: ${chr}:${start + 1}-${end}`
        //             createBlatTrack({sequence, browser: this.browser, name, title})
        //         }
        //     }
        // })


        // Delete Region
        const _delete_ = DOMUtils.div()
        this.body.appendChild(_delete_)
        _delete_.innerText = 'Delete Region'

        _delete_.addEventListener('click', event => {
            event.stopPropagation()
            this.container.style.display = 'none'
            this.browser.roiManager.deleteUserDefinedRegionWithKey(regionElement.dataset.region, this.browser.columnContainer)
        })


        // columnContainer.addEventListener('click', event => {
        //     event.stopPropagation()
        //     this.container.style.display = 'none'
        // })

        this.container.style.left = `${x}px`
        this.container.style.top = `${y}px`
        this.container.style.display = 'flex'

    }

    async __present(x, y, roiManager, columnContainer, regionElement) {

        removeAllChildNodes(this.container)

        const feature = await this.browser.roiManager.findUserDefinedRegionWithKey(regionElement.dataset.region)

        let row

        // Go To
        // row = DOMUtils.div({ class: 'igv-roi-menu-row' })
        // row.innerText = 'Go To'
        // this.container.appendChild(row)
        //
        // row.addEventListener('click', event => {
        //     event.stopPropagation()
        //     this.container.style.display = 'none'
        //
        //     const { locus } = parseRegionKey(regionElement.dataset.region)
        //     this.browser.search(locus)
        // })

        // Description:
        row = DOMUtils.div({class: 'igv-roi-menu-row-edit-description'})
        this.container.appendChild(row)

        row.addEventListener('click', e => {
            e.stopPropagation()
        })

        const str = 'description-input'

        const label = document.createElement('label')
        row.appendChild(label)

        label.setAttribute('for', str)
        label.innerText = 'Description:'

        const input = document.createElement('input')
        row.appendChild(input)

        input.setAttribute('type', 'text')
        input.setAttribute('name', str)
        // input.setAttribute('placeholder', feature.name || 'Edit Description')
        input.setAttribute('placeholder', '')
        input.value = feature.name || ''

        input.addEventListener('change', async e => {

            e.stopPropagation()

            const feature = await this.browser.roiManager.findUserDefinedRegionWithKey(regionElement.dataset.region)
            feature.name = input.value

            input.blur()
            this.container.style.display = 'none'

            await this.browser.roiManager.repaintTable()
        })


        // Delete
        row = DOMUtils.div({class: 'igv-roi-menu-row'})
        row.innerText = 'Delete region'
        this.container.appendChild(row)

        row.addEventListener('click', event => {
            event.stopPropagation()
            this.container.style.display = 'none'
            this.browser.roiManager.deleteUserDefinedRegionWithKey(regionElement.dataset.region, this.browser.columnContainer)
        })

        this.container.style.left = `${x}px`
        this.container.style.top = `${y}px`
        this.container.style.display = 'flex'

        columnContainer.addEventListener('click', event => {
            event.stopPropagation()
            this.container.style.display = 'none'
        })

    }

    dispose() {
        this.container.innerHTML = ''
    }

}

function

removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

export default ROIMenu
