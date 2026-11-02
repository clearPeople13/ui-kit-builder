import type { UiFeature } from '../../../../shared/feature'

export const treeMethodsFeature: UiFeature = {
  id: 'tree.methods',
  expose({ state }) {
    function getCheckedNodes(leafOnly = false) {
      const result: any[] = []
      function walk(list: any[]) {
        for (const node of list) {
          if (state.checkedKeys.value.has(node.key) && (!leafOnly || !node.children.length)) {
            result.push(node.raw)
          }
          if (node.children.length) {
            walk(node.children)
          }
        }
      }
      walk(state.nodes)
      return result
    }

    function setCheckedKeys(keys: Array<string | number>) {
      state.applyCheckedKeys(keys)
    }

    function filter(value: string) {
      state.filterText.value = value ?? ''
    }

    return { getCheckedNodes, setCheckedKeys, filter }
  }
}
