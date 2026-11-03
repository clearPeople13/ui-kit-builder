export function createVerifyDetector(checkCmd, timeout) {
  return {
    id: 'verify',
    title: `校验套件 (${checkCmd})`,
    kind: 'blocking',
    run: async (ctx) => {
      const result = await ctx.runShell(checkCmd, ctx.dir, timeout)
      const output = `${result.stdout}\n${result.stderr}`.trim()
      if (result.code === 0) {
        return { failures: [] }
      }
      return { failures: [{ key: 'check', summary: '', output }] }
    }
  }
}
