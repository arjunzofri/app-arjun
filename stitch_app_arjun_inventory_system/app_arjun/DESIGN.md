---
name: App Arjun
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#43474e'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#002a0d'
  on-tertiary: '#ffffff'
  tertiary-container: '#004319'
  on-tertiary-container: '#38b95d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style
The design system for App Arjun is anchored in the **Corporate / Modern** aesthetic, specifically tailored for high-density enterprise workflows. The brand personality is authoritative yet accessible, conveying a sense of precision and reliability essential for global inventory management. 

The visual language prioritizes clarity and efficiency. It utilizes a structured, card-based layout that organizes complex data sets into digestible units. This approach fosters a trustworthy environment where users can manage high-stakes logistics with confidence. The interface balances deep institutional colors with a crisp, airy background to ensure long-term readability and reduced cognitive load during extended use.

## Colors
The palette is designed to reinforce hierarchy and functional intent. 
- **Primary (#1E3A5F):** Reserved for structural elements like the sidebar and top navigation headers, providing a "grounded" frame for the application.
- **Accent (#2563EB):** Used for interactive states, text links, and informational badges. It draws the eye to navigation cues without being distracting.
- **Action (#16A34A):** Specifically designated for "Success" states and primary "Call to Action" buttons (e.g., Save, Approve, Submit).
- **Neutrals:** The background uses a subtle off-white (#F8FAFC) to differentiate the workspace from the white (#FFFFFF) content cards, creating a clear layer of depth.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. The typographic scale is optimized for information density, using a 16px base for standard body text. 

Hierarchy is established through weight and color rather than excessive size differences. Secondary information and labels should utilize the Medium Gray (#64748B) to keep the primary data points prominent. For data tables and SKU numbers, the "body-sm" or "code" styles should be used to maximize the number of visible rows without sacrificing readability.

## Layout & Spacing
The system employs a **Fluid Grid** model with a 12-column structure for main dashboard views. A 4px baseline shift ensures consistent vertical rhythm across all components.

- **High Density:** Padding within cards and table rows should lean toward the tighter side (8px to 12px) to ensure significant data visibility on a single screen.
- **Margins:** Standard page margins are 24px, providing enough "breathing room" to prevent the interface from feeling cramped despite the high density of internal content.
- **Alignment:** All elements must snap to the 4px grid. Components like input fields and buttons should maintain a consistent height (typically 36px or 40px) to ensure horizontal alignment across rows.

## Elevation & Depth
Elevation is communicated through **Tonal Layers** and **Ambient Shadows**. The design avoids heavy drop shadows to maintain a clean, professional look.

- **Level 0 (Background):** Page background in #F8FAFC.
- **Level 1 (Surface):** Main content cards and containers in #FFFFFF with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 1px 3px rgba(0,0,0,0.05)).
- **Level 2 (Interaction):** Hovered cards or active dropdowns increase shadow spread slightly (0px 4px 6px rgba(0,0,0,0.07)) to indicate interactivity.
- **Level 3 (Overlay):** Modals and flyouts use a more pronounced shadow and a semi-transparent backdrop (#1E293B at 50% opacity) to focus the user's attention.

## Shapes
The design system uses **Soft (0.25rem)** roundedness as the standard for all functional elements. This subtle rounding softens the "industrial" feel of the enterprise software while maintaining a structured, grid-aligned appearance.

- **Components:** Buttons, Input fields, and Chips use 0.25rem (4px).
- **Containers:** Large cards and modals use `rounded-lg` (0.5rem / 8px) to distinguish them as structural parents.
- **Active Indicators:** Vertical tabs in the sidebar use a 2px left-side pill or a fully rounded right-side cap to indicate the active state.

## Components
Consistent component styling is vital for the professional integrity of the system:

- **Buttons:** 
  - *Primary (Action):* Green #16A34A background, white text.
  - *Secondary:* White background, #1E3A5F border and text.
  - *Ghost:* No border, #2563EB text, subtle gray background on hover.
- **Input Fields:** 1px border (#CBD5E1), 4px border-radius. Focus state uses the #2563EB accent color for the border and a subtle blue outer glow.
- **Chips/Badges:** Used for status (e.g., "In Stock", "Low Wood"). Use light tinted backgrounds with dark text (e.g., light green background with dark green text).
- **Data Tables:** The core of the system. Use #F8FAFC for the header row background. Rows should have a subtle bottom border. High-density row height is 40px.
- **Cards:** White background, 1px light gray border, 8px corner radius. Used to group related inventory metrics or form sections.
- **Side Navigation:** Deep Navy #1E3A5F background. Icons should be simplified line art in a lightened version of the accent blue or white. Active items get a #2563EB background or indicator.