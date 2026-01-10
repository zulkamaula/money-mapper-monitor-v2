# UI Conventions & Best Practices

This document outlines the UI/UX conventions and component usage patterns for the M3 Nuxt application.

---

## 🎨 **Component Usage Guidelines**

### **Vuetify Components**

#### **Tree-shaking Configuration**
All Vuetify components must be explicitly imported in `plugins/vuetify.ts` for tree-shaking optimization.

**Adding New Components:**
```typescript
// 1. Import at top
import { VNewComponent } from 'vuetify/components'

// 2. Register in components object
components: {
  VNewComponent,
  // ... other components
}
```

---

### **Preferred Components**

#### **VMenu over VTooltip**
**❌ Don't use:**
```vue
<VTooltip>
  <template #activator="{ props }">
    <VIcon v-bind="props" icon="mdi-info" />
  </template>
  <span>Info text</span>
</VTooltip>
```

**✅ Use instead:**
```vue
<VMenu>
  <template #activator="{ props }">
    <VIcon v-bind="props" icon="mdi-info" />
  </template>
  <VCard max-width="300">
    <VCardText class="text-caption">
      Info text
    </VCardText>
  </VCard>
</VMenu>
```

**Reason:** VMenu provides better UX with click interaction, better mobile support, and consistent styling across the app.

---

#### **VSkeletonLoader (not VSkeleton)**
**❌ Don't use:**
```vue
<VSkeleton type="chip" />
```

**✅ Use instead:**
```vue
<VSkeletonLoader type="chip" />
```

**Reason:** `VSkeletonLoader` is the correct Vuetify 3 component name.

---

## 📐 **Layout Patterns**

### **Responsive Grid**
Use Vuetify's grid system with breakpoints:
```vue
<VRow>
  <VCol cols="12" md="6" lg="4">
    <!-- Content -->
  </VCol>
</VRow>
```

**Breakpoints:**
- `xs` - Extra small (< 600px)
- `sm` - Small (600px - 960px)
- `md` - Medium (960px - 1280px)
- `lg` - Large (1280px - 1920px)
- `xl` - Extra large (> 1920px)

---

### **Dialog Sizing**
- Small dialogs: `max-width="500"`
- Medium dialogs: `max-width="800"`
- Large dialogs: `max-width="1200"`

---

## 🎯 **Icon Usage**

### **Material Design Icons (MDI)**
Use MDI icons with the `mdi-` prefix:
```vue
<VIcon icon="mdi-history" />
<VIcon icon="mdi-wallet-outline" />
<VIcon icon="mdi-note-text" />
```

**Common Icons:**
- History: `mdi-history`
- Wallet: `mdi-wallet-outline`
- Note: `mdi-note-text`
- Edit: `mdi-pencil`
- Delete: `mdi-delete`
- Close: `mdi-close`
- Menu: `mdi-dots-vertical`

---

## 🎨 **Color Palette**

### **Theme Colors**
```typescript
primary: '#0F766E'   // Teal
secondary: '#14B8A6' // Light Teal
accent: '#06B6D4'    // Cyan
error: '#EF4444'     // Red
warning: '#F59E0B'   // Amber
info: '#3B82F6'      // Blue
success: '#10B981'   // Green
```

### **Usage:**
```vue
<VBtn color="primary" />
<VChip color="success" variant="tonal" />
<VIcon color="error" />
```

---

## 📝 **Typography**

### **Font Family**
- Primary: Poppins, sans-serif

### **Text Classes**
```vue
<div class="text-h6">Heading 6</div>
<div class="text-subtitle-1">Subtitle</div>
<div class="text-body-2">Body text</div>
<div class="text-caption">Caption</div>
```

### **Font Weights**
```vue
<span class="font-weight-bold">Bold</span>
<span class="font-weight-medium">Medium</span>
<span class="font-weight-semibold">Semibold</span>
```

---

## 🔄 **Loading States**

### **Skeleton Loaders**
```vue
<!-- Simple loader -->
<VSkeletonLoader type="chip" />

<!-- List loader -->
<VSkeletonLoader type="list-item-avatar" v-for="i in 3" :key="i" />

<!-- Card loader -->
<VSkeletonLoader type="card" />
```

### **Progress Indicators**
```vue
<VProgressCircular indeterminate color="primary" />
```

---

## 📦 **Card Patterns**

### **Standard Card**
```vue
<VCard elevation="0" variant="outlined" rounded="xl">
  <VCardTitle class="pa-4">
    Title
  </VCardTitle>
  <VCardText class="pa-4">
    Content
  </VCardText>
  <VCardActions class="pa-4">
    <VSpacer />
    <VBtn>Action</VBtn>
  </VCardActions>
</VCard>
```

### **Tonal Variant**
```vue
<VCard variant="tonal" color="primary">
  <VCardText>
    Highlighted content
  </VCardText>
</VCard>
```

---

## ✅ **Form Guidelines**

### **Default Colors**
All form inputs default to `primary` color (configured in vuetify.ts):
```vue
<VTextField label="Name" />
<VSelect label="Type" :items="items" />
<VAutocomplete label="Search" />
```

### **Validation**
```vue
<VTextField
  label="Email"
  :rules="[v => !!v || 'Required']"
  validate-on="blur"
/>
```

---

## 🚨 **Common Mistakes**

### ❌ **Don't:**
1. Use VTooltip (use VMenu instead)
2. Use VSkeleton (use VSkeletonLoader instead)
3. Forget to register new components in vuetify.ts
4. Use inline styles (use Vuetify classes)
5. Hardcode colors (use theme colors)

### ✅ **Do:**
1. Use VMenu for popover content
2. Use VSkeletonLoader for loading states
3. Register all Vuetify components used
4. Use utility classes for spacing/sizing
5. Reference theme colors by name

---

## 📚 **Related Documentation**

- [API Patterns](./API_PATTERNS.md) - Backend/frontend patterns
- [Optimization Guide](../OPTIMIZATION_GUIDE.md) - Performance best practices
- [Vuetify 3 Docs](https://vuetifyjs.com/en/) - Official documentation

---

**Last Updated:** Jan 10, 2026
