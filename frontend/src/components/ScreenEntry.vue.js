/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, watch } from 'vue';
import { useScreenStore } from '../store/screen';
const store = useScreenStore();
const loginAccount = ref('');
const loginPassword = ref('');
watch(() => store.entryOpen, (open) => {
    if (open) {
        loginAccount.value = '';
        loginPassword.value = '';
        store.loginError = '';
    }
});
watch(() => store.enabled, (v) => { if (v)
    store.enableError = null; });
function doLogin() {
    if (!loginAccount.value.trim() || !loginPassword.value) {
        store.loginError = '访问被拒绝：账号与口令均不能为空';
        return;
    }
    store.login(loginAccount.value, loginPassword.value);
}
function doEnable() { store.enable(); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.store.entryOpen),
    title: (__VLS_ctx.store.enabled ? '进入大屏（只读）' : '启用大屏访问控制'),
    width: "440px",
    closeOnClickModal: (false),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.store.entryOpen),
    title: (__VLS_ctx.store.enabled ? '进入大屏（只读）' : '启用大屏访问控制'),
    width: "440px",
    closeOnClickModal: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
if (__VLS_ctx.store.enabled) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_5 = {}.ElForm;
    /** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
        size: "default",
    }));
    const __VLS_7 = __VLS_6({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
        size: "default",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_9;
    let __VLS_10;
    let __VLS_11;
    const __VLS_12 = {
        onSubmit: () => { }
    };
    __VLS_8.slots.default;
    const __VLS_13 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        label: "账号",
    }));
    const __VLS_15 = __VLS_14({
        label: "账号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    __VLS_16.slots.default;
    const __VLS_17 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
        modelValue: (__VLS_ctx.loginAccount),
        placeholder: "请输入已授权账号",
        clearable: true,
    }));
    const __VLS_19 = __VLS_18({
        modelValue: (__VLS_ctx.loginAccount),
        placeholder: "请输入已授权账号",
        clearable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    var __VLS_16;
    const __VLS_21 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        label: "口令",
    }));
    const __VLS_23 = __VLS_22({
        label: "口令",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    __VLS_24.slots.default;
    const __VLS_25 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.loginPassword),
        type: "password",
        showPassword: true,
        placeholder: "请输入大屏口令",
    }));
    const __VLS_27 = __VLS_26({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.loginPassword),
        type: "password",
        showPassword: true,
        placeholder: "请输入大屏口令",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    let __VLS_29;
    let __VLS_30;
    let __VLS_31;
    const __VLS_32 = {
        onKeyup: (__VLS_ctx.doLogin)
    };
    var __VLS_28;
    var __VLS_24;
    var __VLS_8;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint" },
    });
    (__VLS_ctx.store.accounts.join('、') || '（无）');
    if (__VLS_ctx.store.loginError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "error" },
        });
        (__VLS_ctx.store.loginError);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_33 = {}.ElForm;
    /** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
        size: "default",
    }));
    const __VLS_35 = __VLS_34({
        ...{ 'onSubmit': {} },
        labelPosition: "top",
        size: "default",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    let __VLS_37;
    let __VLS_38;
    let __VLS_39;
    const __VLS_40 = {
        onSubmit: () => { }
    };
    __VLS_36.slots.default;
    const __VLS_41 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        label: "大屏口令（必填，留空无法启用）",
    }));
    const __VLS_43 = __VLS_42({
        label: "大屏口令（必填，留空无法启用）",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    const __VLS_45 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        modelValue: (__VLS_ctx.store.enablePassword),
        type: "password",
        showPassword: true,
        placeholder: "设置非空口令",
    }));
    const __VLS_47 = __VLS_46({
        modelValue: (__VLS_ctx.store.enablePassword),
        type: "password",
        showPassword: true,
        placeholder: "设置非空口令",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    var __VLS_44;
    const __VLS_49 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        label: "授权账号（至少一个，多个用逗号或换行分隔）",
    }));
    const __VLS_51 = __VLS_50({
        label: "授权账号（至少一个，多个用逗号或换行分隔）",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    const __VLS_53 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        modelValue: (__VLS_ctx.store.enableAccountsText),
        type: "textarea",
        rows: (3),
        placeholder: "例如：trader01, trader02",
    }));
    const __VLS_55 = __VLS_54({
        modelValue: (__VLS_ctx.store.enableAccountsText),
        type: "textarea",
        rows: (3),
        placeholder: "例如：trader01, trader02",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    var __VLS_52;
    var __VLS_36;
    if (__VLS_ctx.store.enableError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "error" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "error-title" },
        });
        (__VLS_ctx.store.enableError.message);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [it, i] of __VLS_getVForSourceType((__VLS_ctx.store.enableError.items))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (i),
            });
            (it);
        }
    }
}
{
    const { footer: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_57 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        ...{ 'onClick': {} },
    }));
    const __VLS_59 = __VLS_58({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    let __VLS_61;
    let __VLS_62;
    let __VLS_63;
    const __VLS_64 = {
        onClick: (...[$event]) => {
            __VLS_ctx.store.entryOpen = false;
        }
    };
    __VLS_60.slots.default;
    var __VLS_60;
    if (__VLS_ctx.store.enabled) {
        const __VLS_65 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_67 = __VLS_66({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_66));
        let __VLS_69;
        let __VLS_70;
        let __VLS_71;
        const __VLS_72 = {
            onClick: (__VLS_ctx.doLogin)
        };
        __VLS_68.slots.default;
        var __VLS_68;
    }
    else {
        const __VLS_73 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_75 = __VLS_74({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_74));
        let __VLS_77;
        let __VLS_78;
        let __VLS_79;
        const __VLS_80 = {
            onClick: (__VLS_ctx.doEnable)
        };
        __VLS_76.slots.default;
        var __VLS_76;
    }
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['error-title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            store: store,
            loginAccount: loginAccount,
            loginPassword: loginPassword,
            doLogin: doLogin,
            doEnable: doEnable,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
