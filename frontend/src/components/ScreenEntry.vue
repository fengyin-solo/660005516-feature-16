<template>
  <el-dialog v-model="store.entryOpen" :title="store.enabled ? '进入大屏（只读）' : '启用大屏访问控制'" width="440px" :close-on-click-modal="false">
    <!-- 已启用：授权登录 -->
    <div v-if="store.enabled">
      <el-form label-position="top" size="default" @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="loginAccount" placeholder="请输入已授权账号" clearable />
        </el-form-item>
        <el-form-item label="口令">
          <el-input v-model="loginPassword" type="password" show-password placeholder="请输入大屏口令"
            @keyup.enter="doLogin" />
        </el-form-item>
      </el-form>
      <div class="hint">仅以下已授权账号可进入大屏（只读浏览行情与报告）：{{ store.accounts.join('、') || '（无）' }}</div>
      <div class="error" v-if="store.loginError">{{ store.loginError }}</div>
    </div>

    <!-- 未启用：配置口令与授权账号 -->
    <div v-else>
      <el-form label-position="top" size="default" @submit.prevent>
        <el-form-item label="大屏口令（必填，留空无法启用）">
          <el-input v-model="store.enablePassword" type="password" show-password placeholder="设置非空口令" />
        </el-form-item>
        <el-form-item label="授权账号（至少一个，多个用逗号或换行分隔）">
          <el-input v-model="store.enableAccountsText" type="textarea" :rows="3"
            placeholder="例如：trader01, trader02" />
        </el-form-item>
      </el-form>
      <div class="error" v-if="store.enableError">
        <div class="error-title">⚠ {{ store.enableError.message }}，不合格项：</div>
        <ul><li v-for="(it, i) in store.enableError.items" :key="i">{{ it }}</li></ul>
      </div>
    </div>

    <template #footer>
      <el-button @click="store.entryOpen = false">取消</el-button>
      <el-button v-if="store.enabled" type="primary" @click="doLogin">进入大屏</el-button>
      <el-button v-else type="primary" @click="doEnable">启用大屏</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useScreenStore } from '../store/screen'
const store = useScreenStore()
const loginAccount = ref('')
const loginPassword = ref('')

watch(() => store.entryOpen, (open) => {
  if (open) { loginAccount.value = ''; loginPassword.value = ''; store.loginError = '' }
})
watch(() => store.enabled, (v) => { if (v) store.enableError = null })

function doLogin() {
  if (!loginAccount.value.trim() || !loginPassword.value) {
    store.loginError = '访问被拒绝：账号与口令均不能为空'
    return
  }
  store.login(loginAccount.value, loginPassword.value)
}
function doEnable() { store.enable() }
</script>

<style scoped>
.hint{font-size:12px;color:#64748b;line-height:1.6;margin-top:-4px}
.error{margin-top:10px;background:#7f1d1d22;border:1px solid #7f1d1d;border-radius:6px;padding:8px 12px;color:#fca5a5;font-size:12px;line-height:1.7}
.error-title{font-weight:700;margin-bottom:2px}
.error ul{padding-left:18px}
</style>
