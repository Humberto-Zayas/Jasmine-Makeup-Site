import { ContentItem } from './contentItem';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(Flip);
import { Observer } from 'gsap/Observer';
gsap.registerPlugin(Observer);

const body = document.body;

let winsize = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener('resize', () => {
    winsize = { width: window.innerWidth, height: window.innerHeight };
});

/**
 * Class representing the Slideshow
 */
export class Slideshow {
    // DOM elements
    DOM = {
        // main element (.stack)
        el: null,
        // stack items (.stack__item)
        items: null,

        // the DOM location of the .stacks element when the slideshow is closed
        stackWrap: document.querySelector('.stack-wrap'),
        // the DOM location of the .stacks element when the slideshow is open
        slides: document.querySelector('.slides'),

        // .content element
        content: document.querySelector('.content'),
        // the content items (.content__item)
        contentItems: [...document.querySelectorAll('.content__item')],

        // the main title ("Photography")
        mainTitleTexts: [...document.querySelectorAll('.title > .oh > .oh__inner')],

        // back control (.content__back)
        backCtrl: document.querySelector('.content__back'),
        // navigation (.content__nav-wrap)
        nav: document.querySelector('.content__nav-wrap'),
        // navigation arrows
        navArrows: {
            prev: document.querySelector('.content__nav--prev'),
            next: document.querySelector('.content__nav--next'),
        }
    }
    // Content instances
    contentItems = [];
    // Check if Slideshow is in open mode or closed mode
    isOpen = false;
    // Current item's position
    current = -1;
    // Total items
    totalItems = 0;
    // items gap (CSS variable)
    gap = getComputedStyle(document.documentElement).getPropertyValue('--slide-gap');

    // Map to associate slides with content items
    slideToContentMap = [];

    /**
     * Constructor.
     * @param {NodeList} DOM_el - main element (.stack)
     */
    constructor(DOM_el) {
        this.DOM.el = DOM_el;

        this.DOM.items = [...this.DOM.el.querySelectorAll('.stack__item:not(.stack__item--empty)')];
        this.totalItems = this.DOM.items.length;
        this.DOM.contentItems.forEach(item => this.contentItems.push(new ContentItem(item)));

        this.initEvents();
        this.createSlideToContentMap();
    }

    /**
     * Create the slide to content mapping
     */
    createSlideToContentMap() {
        // Define your custom mapping here
        const mapping = [
            0, // Slide 1 corresponds to Content Item 0
            0, // Slide 2 corresponds to Content Item 1
            1, // Slide 3 corresponds to Content Item 1
            1, // Slide 4 corresponds to Content Item 2
            2, // Slide 5 corresponds to Content Item 2
            3, // Slide 6 corresponds to Content Item 2
            3, // Slide 7 corresponds to Content Item 3
            4,
            4,
            5,
            5,
            6
        ];

        for (let i = 0; i < this.totalItems; i++) {
            this.slideToContentMap[i] = mapping[i];
        }
    }

    /**
     * Event binding.
     */
    initEvents() {
        this.DOM.items.forEach((item, position) => {
            // Clicking on a stack item reveals the slideshow navigation and the item's content
            item.addEventListener('click', () => {
                // Show the item's content
                this.open(item);
            });
        });

        this.DOM.backCtrl.addEventListener('click', () => {
            this.close();
        });

        this.DOM.navArrows.next.addEventListener('click', () => {
            this.navigate('next');
        });
        this.DOM.navArrows.prev.addEventListener('click', () => {
            this.navigate('prev');
        });

        // Add touch event listeners for swiping
        this.addTouchEventListeners();
    }

    /**
     * Add touch event listeners for swipe functionality.
     */
    addTouchEventListeners() {
        let touchStartY = 0;
        let touchEndY = 0;

        // Handle touch start event
        this.DOM.el.addEventListener('touchstart', (event) => {
            touchStartY = event.touches[0].clientY; // Get the Y position of the touch
        });

        // Handle touch end event
        this.DOM.el.addEventListener('touchend', (event) => {
            touchEndY = event.changedTouches[0].clientY; // Get the Y position of the released touch
            this.handleSwipe(touchStartY, touchEndY);
        });
    }

    /**
     * Handle swipe direction based on touch positions.
     * @param {number} startY - The starting Y position of the touch.
     * @param {number} endY - The ending Y position of the touch.
     */
    handleSwipe(startY, endY) {
        const swipeThreshold = 30; // Minimum distance to consider a swipe

        if (startY - endY > swipeThreshold) {
            // Swipe up
            this.navigate('next');
        } else if (endY - startY > swipeThreshold) {
            // Swipe down
            this.navigate('prev');
        }
    }

    /**
     * Opens the slideshow navigation and reveals the item's content.
     * @param {NodeList} stackItem - the clicked item
     */
    open(stackItem) {
        if (this.isAnimating || this.isOpen) {
            return;
        }
        this.isAnimating = true;

        // Update the current value
        this.current = this.DOM.items.indexOf(stackItem);

        const scrollY = window.scrollY;

        body.classList.add('oh');
        this.DOM.content.classList.add('content--open');

        // Set CSS current classes to both content and stack item elements
        this.contentItems[this.slideToContentMap[this.current]].DOM.el.classList.add('content__item--current');
        this.DOM.items[this.current].classList.add('stack__item--current');

        const state = Flip.getState(this.DOM.items, { props: 'opacity' });
        this.DOM.slides.appendChild(this.DOM.el);

        const itemCenter = stackItem.offsetTop + stackItem.offsetHeight / 2;

        // Seems to solve a bug in firefox
        document.documentElement.scrollTop = document.body.scrollTop = 0;

        gsap.set(this.DOM.el, {
            y: winsize.height / 2 - itemCenter + scrollY
        });

        // Seems to solve a bug in firefox
        document.documentElement.scrollTop = document.body.scrollTop = 0;

        // Flip
        Flip.from(state, {
            duration: 1,
            ease: 'expo',
            onComplete: () => {
                this.isOpen = true;
                this.isAnimating = false;
            },
            // Seems to solve a bug in firefox
            onStart: () => document.documentElement.scrollTop = document.body.scrollTop = scrollY,
            absoluteOnLeave: true,
        })
            .to(this.DOM.mainTitleTexts, {
                duration: .9,
                ease: 'expo',
                yPercent: -101
            }, 0)
            .to(this.contentItems[this.slideToContentMap[this.current]].DOM.texts, {
                duration: 1,
                ease: 'expo',
                startAt: { yPercent: 101 },
                yPercent: 0
            }, 0)
            .to(this.DOM.backCtrl, {
                duration: 1,
                ease: 'expo',
                startAt: { opacity: 0 },
                opacity: 1
            }, 0)
            .to([this.DOM.navArrows.prev, this.DOM.navArrows.next], {
                duration: 1,
                ease: 'expo',
                startAt: {
                    opacity: 0,
                    y: pos => pos ? -150 : 150
                },
                y: 0,
                opacity: pos => this.current === 0 && !pos || this.current === this.totalItems - 1 && pos ? 0 : 1
            }, 0);
    }

    /**
     * Closes the slideshow navigation and hides the content
     */
    close() {
        if (this.isAnimating || !this.isOpen) {
            return;
        }
        this.isAnimating = true;

        this.DOM.items[this.current].classList.remove('stack__item--current');

        body.classList.remove('oh');

        const state = Flip.getState(this.DOM.items, { props: 'opacity' });
        this.DOM.stackWrap.appendChild(this.DOM.el);

        gsap.set(this.DOM.el, {
            y: 0
        });

        // Flip
        Flip.from(state, {
            duration: 1,
            ease: 'expo',
            onComplete: () => {
                this.DOM.content.classList.remove('content--open');
                this.contentItems[this.slideToContentMap[this.current]].DOM.el.classList.remove('content__item--current');

                this.current = -1;
                this.isOpen = false;
                this.isAnimating = false;
            },
            absoluteOnLeave: true
        })
            .to(this.DOM.mainTitleTexts, {
                duration: .9,
                ease: 'expo',
                startAt: { yPercent: 101 },
                yPercent: 0
            }, 0)
            .to(this.contentItems[this.slideToContentMap[this.current]].DOM.texts, {
                duration: 1,
                ease: 'expo',
                yPercent: -101
            }, 0)
            .to(this.DOM.backCtrl, {
                duration: 1,
                ease: 'expo',
                opacity: 0
            }, 0)
            .to([this.DOM.navArrows.prev, this.DOM.navArrows.next], {
                duration: 1,
                ease: 'expo',
                y: pos => pos ? 100 : -100,
                opacity: 0
            }, 0);
    }

    /**
     * Navigation
     * @param {String} direction 'prev' || 'next'
     */
    navigate(direction) {
        if (this.isAnimating || (direction === 'next' && this.current === this.totalItems - 1) || (direction === 'prev' && this.current === 0)) return;
        this.isAnimating = true;

        const previousCurrent = this.current;
        const currentItem = this.DOM.items[previousCurrent];
        this.current = direction === 'next' ? this.current + 1 : this.current - 1;
        const upcomingItem = this.DOM.items[this.current];

        currentItem.classList.remove('stack__item--current');
        upcomingItem.classList.add('stack__item--current');

        // Show/hide arrows
        gsap.set(this.DOM.navArrows.prev, { opacity: this.current > 0 ? 1 : 0 });
        gsap.set(this.DOM.navArrows.next, { opacity: this.current < this.totalItems - 1 ? 1 : 0 });

        const currentContentIndex = this.slideToContentMap[this.current];
        const previousContentIndex = this.slideToContentMap[previousCurrent];

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
            }
        });

        // Only update the content item if the new slide corresponds to a different content item
        if (currentContentIndex !== previousContentIndex) {
            timeline
                .to(this.contentItems[previousContentIndex].DOM.texts, {
                    duration: 0.2,
                    ease: 'power1',
                    yPercent: direction === 'next' ? 101 : -101,
                    onComplete: () => this.contentItems[previousContentIndex].DOM.el.classList.remove('content__item--current')
                }, 0)
                .to(this.contentItems[currentContentIndex].DOM.texts, {
                    duration: 0.9,
                    ease: 'expo',
                    startAt: { yPercent: direction === 'next' ? -101 : 101 },
                    onStart: () => this.contentItems[currentContentIndex].DOM.el.classList.add('content__item--current'),
                    yPercent: 0
                }, 0.2);
        }

        timeline.to(this.DOM.el, {
            duration: 1,
            ease: 'expo',
            y: direction === 'next' ? `-=${winsize.height * 0.7 + winsize.height * 0.02}` : `+=${winsize.height * 0.7 + winsize.height * 0.02}`
        }, 0);
    }
}
