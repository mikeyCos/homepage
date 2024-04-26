# Readme
---
## Live preview: [Homepage](https://mikeycos.github.io/homepage/)
---
### Ideas
1. Lorem ipsum
---
### Questions
1. How to obtain a current CSS value defined by media queries with JavaScript?
2. If SVG's are being injected into `img` tags, will the attribute `loading: 'lazy'` defer loading images when a user scrolls near them?
3. Do margin, padding, and scroll-margin styles impact the root margin for intersection observers?
---
### Notes
* The 'current' tab on-scroll is not responsive; if a user scrolls down to a new section and scrolls up, the 'current' tab does not update.
---
### About
Project: Homepage

Hello world,

I enjoyed working on this project, especially when it came to styling with CSS. However, I did not design my homepage one-to-one with the provided design files. For example, I did not wrap the text around the image in the about section for a tablet media query. I suspected I am not able to wrap the text because I am use float on a child with grid properties and the child is inside a grid container. Some things I implemented that were not part of the project's specifications: a navigation bar, sidebar for mobile, transition(s) on scroll, and a loading screen.

When a user clicks on the right navigation items, the corresponding section will scroll into view. A `scroll-margin` was required for the 'about' and 'project' sections to keep the section's heading in view upon scroll. A hamburger menu is visible only for mobile screens. Clicking the menu button will transition the button into an 'X' shape and slide in a sidebar from the right side. The sidebar is the right navigation items positioned vertically and will behave the same way as in desktop view with a small caveat. When the navigation items are clicked when the sidebar is open, the sidebar will close and the menu button will transition back to it's original shape. Now, clicking the menu button, as an 'X' shape, will close the sidebar. With the help of intersection observers, when the contact section is scrolled into view for the first time (after page is loaded), it's left and right subsections slide in. The loading screen renders before the main content is rendered and will be remove once the whole page has loaded.

Little did I know about using the `srcset` attribute for image tags and how they work. I am still lacking confidence with how exactly they work, but the browser makes the decision on which source is used from the `srcset`. From my understanding the browser reads the pixel-density of the screen, and the layout size of the image to determine which source is used from the `srcset`. Based on that information, the browser will use the source corresponding to the media condition defined in the images' `sizes` attribute. More information on this can be found at [CSS-Tricks Responsive Images - Browsers Choice](https://css-tricks.com/a-guide-to-the-responsive-images-syntax-in-html/#aa-browsers-choice).

One challenging feature, setting a current navigation item while scrolling through and out of sections. This feature does not work one-hundred percent of the time. I appears each section needs to be scrolled into or past by a certain amount in order to scroll in the opposite direction. Let us say a user scrolls down halfway into the contact's section. The navigation item corresponding to the contact's section is 'marked', and the user decides to scroll up into the project's section. The intersection observer does not read that the project's section has been intersected. I suspect this is due to the fact the section is still in the viewport's view when scrolling down halfway into the contact's section. I am unsure if margin, padding, and scroll-margin impact the intersection observer's root margin. I am still playing around with the intersection observers' options properties `threshold` and `rootMargin`.

To failing forward, cheers!