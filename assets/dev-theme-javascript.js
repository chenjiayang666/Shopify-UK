class anchorWrap extends HTMLElement {
  constructor() {
    super()
    this.selectorStr = this.getAttribute("selector-str")
    this.nthDom = parseInt(this.getAttribute("nth-dom")) || 1
    this.rewriteId = this.getAttribute("rewrite-id")
    this.targetDom = this.getTargetDom()
    if(!this.targetDom) {
      return;
    }
    if(this.rewriteId) {
      this.rewriteDomId()
    }
    this.rewriteAEle()
  }
  getTargetDom() {
    if(this.nthDom - 1 < 0) return null;
    const targetDom = document.querySelectorAll(`${this.selectorStr}`)[this.nthDom - 1]
    return targetDom || null
  }
  rewriteDomId() {
    this.targetDom.setAttribute('id', this.rewriteId);
  }
  rewriteAEle() {
    const aEle = this.querySelector("a")
    const targetDomId = this.targetDom.getAttribute("id")
    if(!aEle || !targetDomId) {
      return;
    }
    aEle.setAttribute("href", `#${targetDomId}`)
  }
}
if (!window.customElements.get("anchor-wrap")) {
  customElements.define("anchor-wrap", anchorWrap)
}

// 评分获取自定义组件
class StarRatingFetch extends HTMLElement {
  constructor() {
    super();
    this.productId = this.getAttribute('product-id');
    this.init();
  }

  init() {
    if (!this.productId) {
      console.error('星级评分组件：未提供产品ID');
      return;
    }

    this.fetchRating();
  }

  fetchRating() {
    const apiUrl = `https://api.judge.me/api/v1/widgets/preview_badge?api_token=VkvIQGkhnyfP89eSuyA7o4Z8dSE&shop_domain=merach-fitness-store.myshopify.com&external_id=${this.productId}`;
    
    fetch(apiUrl)
      .then(response => response.text())
      .then(pureResponse => {
        const response = JSON.parse(pureResponse);
        if (response) {
          // 处理获取到的HTML内容
          // 创建临时DOM元素来解析HTML字符串
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = response.badge;
          
          // 找到并移除 jdgm-prev-badge__text 类名的span标签
          const textSpan = tempDiv.querySelector('.jdgm-prev-badge__text');
          if (textSpan) {
            textSpan.remove();
          }
          
          // 设置处理后的HTML内容
          this.innerHTML = tempDiv.innerHTML;
        }
      })
      .catch(error => {
        console.error("加载 Judge.me 评论失败:", error);
        this.innerHTML = '<div style="color: #999;">评分加载失败</div>';
      });
  }
}

if (!window.customElements.get("star-rating-fetch")) {
  customElements.define("star-rating-fetch", StarRatingFetch);
}

class ProductCoupon extends HTMLElement {
  constructor() {
    super();
    this.couponValue = this.getAttribute('coupon-value');
    // this.couponAmountText = this.getAttribute('coupon-amount-text');
    this.couponTextAfterCopy = this.getAttribute('coupon-text-after-copy');
    this.newPriceSwitchAfterCopy = this.hasAttribute('new-price-switch-after-copy');
    this.copyBtn = this.querySelector('.copy-btn');
    this.couponCodeText = this.querySelector('.coupon-code-text');
    this.textarea = this.querySelector('#coupon-textarea');
    this.timeout = null;
    
    this.init();
  }

  init() {
    if (this.copyBtn && this.couponCodeText) {
      this.copyBtn.addEventListener('click', this.handleCopy.bind(this));
    }
  }

  handleCopy() {
    if (this.timeout) return;
    
    // 复制优惠码
    this.textarea.innerText = this.couponValue;
    this.textarea.select();
    document.execCommand('copy');
    
    // 更改按钮文本
    this.copyBtn.textContent = 'Copied';
    
    // 如果配置了复制后的文本，则更改
    if (this.couponTextAfterCopy) {
      this.couponCodeText.textContent = this.couponTextAfterCopy;
    }
    
    // 只有当new_price_switch_after_copy为true时，才触发价格变化事件
    if (this.newPriceSwitchAfterCopy) {
      const couponEvent = new CustomEvent('coupon:copied', {
        bubbles: true
      });
      
      document.dispatchEvent(couponEvent);
    }
    /*     
    // 4秒后恢复按钮文本
    this.timeout = setTimeout(() => {
      this.copyBtn.textContent = 'Copy Code';
      if(this.couponAmountText) {
        this.couponCodeText.textContent = this.couponAmountText;
      }
      clearTimeout(this.timeout);
      this.timeout = null;
    }, 4000); */
  }
}

if (!window.customElements.get("product-coupon")) {
  customElements.define("product-coupon", ProductCoupon);
}
/* 
  1.on-handle-price-switch和handle-show-dom-class是搭配使用的，使用"on-handle-price-switch"是为了让操作更明确。
*/
class DecreaseNumWithCondition extends HTMLElement {
  constructor() {
    super();
    
    // 检查是否需要同步到fixed-buy-now
    if(this.hasAttribute('sync-to-fixed-buy-now')) {
      this.syncToFixedBuyNow();
    }

    // 监听优惠券代码复制事件
    document.addEventListener('coupon:copied', ()=> {
      this.handleCouponCopied()
    });
  }

  syncToFixedBuyNow() {
    const fixedBuyNowPrice = document.querySelector('decrease-num-with-condition.fixed-part');
    const fixedBuyNowCompareAtPrice = document.querySelector('.fixed-part-compare-price span');
    if(fixedBuyNowPrice) {
      fixedBuyNowPrice.setAttribute('data-original-price', this.getAttribute('data-original-price')); // 动画相关 - 这个是初始价格
      fixedBuyNowPrice.setAttribute('data-final-price', this.getAttribute('data-final-price')); // 动画相关 - 这个是最终价格
      fixedBuyNowPrice.innerHTML = "$" + this.getAttribute('data-original-price'); // 动画无关 - 这个是动态写入当前价格
      fixedBuyNowCompareAtPrice.innerHTML = "$" + this.getAttribute('data-compare-at-price'); // 动画无关 - 这个是动态写入划线价
    }
  }
  
  handleCouponCopied() {
    this.originalPrice = parseFloat(this.getAttribute('data-original-price') || '0');
    this.finalPrice = parseFloat(this.getAttribute('data-final-price') || '0');
    this.handleShowDomClass = this.getAttribute('handle-show-dom-class');
    this.newPriceOnHandlePriceSwitch = this.hasAttribute('new-price-on-handle-price-switch');
    this.fixedBuyNowOnHandlePriceSwitch = this.hasAttribute('fixed-buy-now-on-handle-price-switch');
    this.currentText = this.textContent.trim();
    this.isMonthlySuffix = this.currentText.includes('/mo');
    // 处理new-price.liquid当中的需要切换划线价、展示到手价的情况。
    if(this.newPriceOnHandlePriceSwitch) {
      this.handleNewPriceOnHandlePriceSwitch()
    }
    // 处理fixed-buy-now当中的需要切换划线价、展示到手价的情况。
    if(this.fixedBuyNowOnHandlePriceSwitch) {
      this.handleFixedBuyNowOnHandlePriceSwitch();
    }
    this.animateNumberChange(this.originalPrice, this.finalPrice);
  }

  handleNewPriceOnHandlePriceSwitch() {
    const handleShowDom = document.querySelector(this.handleShowDomClass);
    // 将真正的现价（下面一行）展示出来
    if(handleShowDom) {
      handleShowDom.classList.add('show');
    }
    // 将现价变为划线价（上面一行）
    const currentPrice = document.querySelector('.current-price:not(.current-price-hidden)');
    if(currentPrice) {
      currentPrice.classList.add('compare-at-price');
    }
    // 将badge变为显示
    const badge = document.querySelector('.new-price-container .badge-hidden');
    if(badge) {
      badge.classList.add('show');
    }
  }

  handleFixedBuyNowOnHandlePriceSwitch() {
    const handleShowDom = document.querySelector(this.handleShowDomClass);
    // 将真正的现价（左边一个）展示出来
    if(handleShowDom) {
      handleShowDom.classList.add('show');
    }
    // 将现价变为划线价（右边一个）
    const currentPrice = document.querySelector('.fixed-part-current-price:not(.fixed-part-current-price-hidden)');
    if(currentPrice) {
      currentPrice.classList.add('fixed-part-compare-price');
    }
  }

  async animateNumberChange(from, to) {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      // 如果用户偏好减少动画，则直接显示最终结果而不进行动画
      this.updateNumber(to);
      return;
    }
    
    const duration = 1.0; // 动画持续时间，单位秒
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000; // 转换为秒
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutExpo(progress);
      const currentValue = from + (to - from) * easedProgress;
      
      this.updateNumber(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  // 缓动函数，使数字变化更自然
  easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }
  
  // 更新显示的数字
  updateNumber(value) {
    const formattedValue = value.toFixed(2);
    if (this.isMonthlySuffix) {
      this.textContent = `$${formattedValue}/mo`;
    } else {
      this.textContent = `$${formattedValue}`;
    }
  }
}
if (!window.customElements.get("decrease-num-with-condition")) {
  customElements.define("decrease-num-with-condition", DecreaseNumWithCondition);
}

class PayNowTextContainer extends HTMLElement {
  constructor() {
    super();
    this.init();
    this.setupKlarnaObserver();
  }

  init() {
    this.style.width = this.getBoundingClientRect().width + 'px';
  }

  setupKlarnaObserver() {
    // 创建一个MutationObserver实例
    this.observer = new MutationObserver(() => {
      const klarnaContainer = document.querySelector('div[data-block-id*="klarna_on_site_messaging_app_block"] klarna-placement');
      if (klarnaContainer?.shadowRoot) {
        const klarnaButton = klarnaContainer.shadowRoot.querySelector("button.link");
        klarnaButton.innerHTML = "Learn more";
        const payOverTimeContainer = document.querySelector(".pay-over-time-container");
        const placeholderButton = payOverTimeContainer.querySelector(".klarna-button-placeholder");
        
        if (klarnaButton && payOverTimeContainer && placeholderButton) {
          // 替换占位按钮
          placeholderButton.replaceWith(klarnaButton);
          
          // 停止观察
          this.observer.disconnect();
        }
      }
    });

    // 开始观察整个document的变化
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }
}

if (!window.customElements.get("pay-now-text-container")) {
  customElements.define("pay-now-text-container", PayNowTextContainer);
}

class FixedBuyNowButton extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.addEventListener('click', this.handleClick.bind(this));
  }

  getCheckoutUrl() {
    const productInput = document.querySelector('.product-info__buy-buttons>.shopify-product-form input[name="id"]');
    if (!productInput) return null;
    
    const quantity = document.querySelector("quantity-selector input")?.value || 1;
    return `https://merachfit.com/cart/${productInput.value}:${quantity}?checkout`;
  }

  handleClick() {
    const url = this.getCheckoutUrl();
    if (url) {
      location.href = url;
    }
  }
}

if (!window.customElements.get('fixed-buy-now-button')) {
  customElements.define('fixed-buy-now-button', FixedBuyNowButton);
}

class ExpandableContentBlock extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector('.expandable-container');
    this.button = this.querySelector('.expandable-trigger');
    this.contentWrapper = this.querySelector('.expandable-content__wrapper');
    this.contentInner = this.querySelector('.expandable-content__inner');

    this.button.addEventListener('click', this.toggle.bind(this));
  }

  toggle() {
    const isExpanded = this.container.classList.toggle('is-expanded');

    if (isExpanded) { //即将展开，则设置最大高度为内部内容的最大高度。
      // Expand the content
      // We use scrollHeight to get the full height of the content
      this.contentWrapper.style.maxHeight = `${this.contentInner.scrollHeight}px`;
    } else {  //即将收起，则设置最大高度为空
      // Collapse the content
      // Set max-height back to the initial value defined in CSS
      this.contentWrapper.style.maxHeight = null;
    }
  }
}

if (!window.customElements.get('expandable-content-block')) {
  customElements.define('expandable-content-block', ExpandableContentBlock);
}

class LeftMenuSwitchMegaMenu extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    // 获取所有左侧菜单项
    this.menuItems = this.querySelectorAll('.left-menu-item');
    // 获取所有右侧面板
    this.panels = this.querySelectorAll('.sub-sub-link-panel');
    
    // 为每个菜单项添加点击事件
    this.menuItems.forEach(item => {
      item.addEventListener('click', this.handleMenuItemClick.bind(this, item));
    });
  }

  handleMenuItemClick(clickedItem) {
    // 获取点击的菜单项索引
    const index = clickedItem.dataset.index;
    
    // 移除所有菜单项的active类
    this.menuItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // 为点击的菜单项添加active类
    clickedItem.classList.add('active');
    
    // 隐藏所有面板
    this.panels.forEach(panel => {
      panel.classList.add('hidden');
      panel.classList.remove('active');
    });
    
    // 显示对应的面板
    const targetPanel = this.querySelector(`.sub-sub-link-panel[data-panel-index="${index}"]`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
      targetPanel.classList.add('active');
      
      // 添加动画效果
      this.animatePanelChange(targetPanel);
    }
  }
  
  animatePanelChange(panel) {
    // 为面板添加简单的淡入效果
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(10px)';
    
    // 使用requestAnimationFrame确保DOM更新后再应用动画
    requestAnimationFrame(() => {
      panel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
      
      // 清除过渡效果，以便下次切换
      setTimeout(() => {
        panel.style.transition = '';
      }, 300);
    });
  }
}

if (!window.customElements.get('left-switch-mega-menu')) {
  customElements.define('left-switch-mega-menu', LeftMenuSwitchMegaMenu);
}

class ProductKeyFeaturesDialog extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const templateId = this.getAttribute('template-id');
    if(!templateId) {
      return
    }

    const template = document.getElementById(templateId);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    // 点击关闭按钮后关闭
    const closeButton = this.shadowRoot.querySelector('.dialog-close-button');
    closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩也关闭
    const closeMask = this.shadowRoot.querySelector('#close-mask');
    closeMask.addEventListener('click', () => {
      this.close();
    });

    // 为了在层叠优先级中最高，所以需要将这个元素移动到body的最后面
    this.parentElement.removeChild(this);
    document.body.appendChild(this);

    // 默认隐藏
    this.hidden();
  }

  hidden() {
    this.style.display = 'none';
  }

  show() {
    this.style.display = 'block';
  }

  close() {
    this.hidden();
  }
}

if (!window.customElements.get('product-key-features-dialog')) {
  customElements.define('product-key-features-dialog', ProductKeyFeaturesDialog);
}


class ProductServicesAndBenefitsDialog extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const templateId = this.getAttribute('template-id');
    if(!templateId) {
      return
    }

    const template = document.getElementById(templateId);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // 点击关闭按钮后关闭
    const closeButton = this.shadowRoot.querySelector('.dialog-close-button');
    closeButton.addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩也关闭
    const closeMask = this.shadowRoot.querySelector('#close-mask');
    closeMask.addEventListener('click', () => {
      this.close();
    });

    // 为了在层叠优先级中最高，所以需要将这个元素移动到body的最后面
    this.parentElement.removeChild(this);
    document.body.appendChild(this);

    // 默认隐藏
    this.hidden();
    this.setupItems();
  }

  setupItems() {
    const items = this.shadowRoot.querySelectorAll('.item');
    items.forEach(item => {
      const header = item.querySelector('.item-title');
      header.addEventListener('click', () => {
        const content = item.querySelector('.item-description');

        // 把其他都合拢
        items.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.item-description').style.maxHeight = '0px';
          }
        });

        // 把当前的展开
        item.classList.toggle('active');
        if(item.classList.contains('active')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0px';
        }
      });
    });
  }

  hidden() {
    this.style.display = 'none';
  }

  show(itemId) {
    this.style.display = 'block';
    const item = this.shadowRoot.querySelector(`.item[data-item-id="${itemId}"]`);
    if(item) {
      const content = item.querySelector('.item-description');

      // 第一次展开禁用动画
      content.style.transition = 'none';

      // 把其他都合拢
      this.shadowRoot.querySelectorAll('.item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.item-description').style.maxHeight = '0px';
      });

      item.classList.add('active');
      content.style.maxHeight = content.scrollHeight + 'px';

      // 恢复动画
      requestAnimationFrame(() => {
        content.style.transition = '';
      });
    }
  }

  close() {
    this.hidden();
  }
}

if (!window.customElements.get('product-services-and-benefits-dialog')) {
  customElements.define('product-services-and-benefits-dialog', ProductServicesAndBenefitsDialog);
}

class ArticleTableOfContents extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.articleContentId = this.getAttribute('article-content-id');
    this.targetContainerId = this.getAttribute('target-container-id');
    this.articleContent = document.getElementById(this.articleContentId);
    if(this.articleContent) {
      this.setupResizeObserver();
      this.insertNestedTableOfContents(this.targetContainerId);
    }
  }

  generateNestedTableOfContents() {
    const headings = this.articleContent.querySelectorAll('h2');
    
    if (headings.length === 0) {
        console.log('没有找到任何标题标签');
        return null;
    }
    
    const rootUl = document.createElement('ul');
    const stickyTop = 124 + 85;
    rootUl.style.cssText = `
      overflow-y:auto;
      list-style: none;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
      margin: 0; 
      position: sticky; 
      top: ${stickyTop}px;`
    
    const stack = [{ ul: rootUl, level: 0 }];
    
    headings.forEach((heading) => {
        // 获取或生成id
        let id = heading.getAttribute('id');
        if (!id) {
            id = 'heading-' + heading.textContent.trim().toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '');
            heading.setAttribute('id', id);
        }
        
        const text = heading.textContent.trim();
        const currentLevel = parseInt(heading.tagName.charAt(1));
        
        // 调整栈层级
        while (stack.length > 1 && stack[stack.length - 1].level >= currentLevel) {
            stack.pop();
        }
        
        const currentContainer = stack[stack.length - 1];
        
        // 创建li和链接
        const li = document.createElement('li');
        li.style.marginTop = '0.5rem';
        
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = text;
        link.style.cssText = `
            text-decoration: none; 
            color: #333; 
            font-size: ${this.getFontSize(currentLevel)};
            font-weight: ${this.getFontWeight(currentLevel)};
            line-height: 1.4;
            display: block;
            padding: 0.25rem 0;
        `;
        
        // 添加事件
        link.onclick = (e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        };
        
        link.onmouseenter = () => {
          link.style.color = ' #15C4FE';
          link.style.textDecoration = 'underline';
        }
        link.onmouseleave = () => {
          link.style.color = '#333';
          link.style.textDecoration = 'none';
        }
        
        // 创建子ul
        const childUl = document.createElement('ul');
        childUl.style.cssText = `
            list-style: none; 
            padding: 0; 
            margin: 0.5rem 0 0 0;
            padding-left: 2.5rem;
            border-left: 2px solid #e0e0e0;
        `;
        
        li.appendChild(link);
        li.appendChild(childUl);
        currentContainer.ul.appendChild(li);
        
        stack.push({ ul: childUl, level: currentLevel });
    });
    
    // 清理空ul
    rootUl.querySelectorAll('ul').forEach(ul => {
        if (ul.children.length === 0) ul.remove();
    });
    
    return rootUl;
  }

  getFontSize(level) {
      const sizes = ['1.1rem', '1rem', '0.95rem', '0.9rem', '0.85rem', '0.8rem'];
      return sizes[level - 1] || '0.9rem';
  }

  getFontWeight(level) {
      return level <= 2 ? 'bold' : level <= 4 ? '600' : 'normal';
  }

  setupResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        // 当内容尺寸变化时，重新计算目录
        this.updateTableOfContentsHeight();
      });
      
      this.resizeObserver.observe(this.articleContent);
    }
  }
  
  updateTableOfContentsHeight() {
    if (this.tableOfContentsContainer) {
      const newHeight = this.articleContent.scrollHeight;
      this.tableOfContentsContainer.style.height = `${newHeight}px`;
    }
  }

  insertNestedTableOfContents(containerId) {
      const toc = this.generateNestedTableOfContents();
      if (!toc) return;

      const articleBanner = document.querySelector('.article-banner');
      const articleBannerTop = articleBanner.offsetTop;
      const articleBannerHeight = articleBanner.offsetHeight;
      const articleBannerBottom = articleBannerTop + articleBannerHeight;

      const articleContentHeight = this.articleContent.scrollHeight;
      
      const container = document.createElement('div');
      container.style.cssText = `
          padding: 1rem;
          padding-top: 0;
          box-sizing: border-box;
          margin: 4rem 0;
          background-color: white;
          height: ${articleContentHeight}px;
      `;

      const title = document.createElement('div');
      title.innerHTML = `
        <svg style="color:#15C4FE;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#15C4FE">
          <g clip-path="url(#clip0_8741_74)">
            <path d="M19.4642 2.5632V16.5718C19.4884 16.9438 19.4795 17.3173 19.4378 17.6877C19.3584 18.1434 19.1734 18.5742 18.8975 18.9455C18.5053 19.4455 17.9499 19.7918 17.3284 19.924C16.9902 19.9796 16.647 19.9973 16.3049 19.977H3.71106C3.39577 19.9956 3.07942 19.9833 2.76656 19.94C2.1456 19.8306 1.5828 19.5066 1.1764 19.0245C0.88563 18.6623 0.684294 18.2367 0.588706 17.7822C0.534961 17.3722 0.520903 16.958 0.546728 16.5453V3.35228C0.521967 2.92663 0.544763 2.49955 0.614692 2.07895C0.716175 1.6447 0.924315 1.2426 1.22028 0.909025C1.51626 0.575447 1.89072 0.320918 2.3098 0.168461C2.79534 0.028957 3.30154 -0.0244883 3.80551 0.0105441H13.8847C14.2625 0.0105441 16.6392 0.0140423 17.017 0.0155415C17.3815 0.0565601 17.7354 0.163583 18.0615 0.331375C18.6376 0.656335 19.0802 1.17467 19.3108 1.7946C19.3673 1.95908 19.4094 2.12812 19.4368 2.29984C19.4468 2.38779 19.4552 2.47524 19.4642 2.5632ZM17.9685 2.64715L17.958 2.53671L17.8896 2.27335C17.7917 2.02628 17.6164 1.81762 17.3898 1.67866C17.0305 1.52061 16.6351 1.46243 16.2454 1.51025H3.99591C3.64057 1.47976 3.28284 1.49218 2.93047 1.54723C2.73536 1.5995 2.55662 1.70019 2.41081 1.83997C2.265 1.97975 2.15686 2.15408 2.09641 2.34681C2.04065 2.63442 2.023 2.92813 2.04394 3.22035V16.6238C2.02023 16.9292 2.02894 17.2362 2.06992 17.5398C2.12516 17.7481 2.22778 17.9409 2.36977 18.103C2.6776 18.4848 3.18684 18.4763 3.87597 18.4763H16.2424C16.5193 18.4963 16.7975 18.4841 17.0715 18.4398C17.3327 18.3713 17.5636 18.2176 17.7277 18.003C18.003 17.6272 17.969 17.219 17.969 16.5763V2.64715H17.9685ZM16.18 9.90532C16.2036 10.0815 16.1593 10.2602 16.056 10.4049C15.9527 10.5496 15.7981 10.6495 15.6238 10.6844C15.4413 10.7062 15.2572 10.7097 15.0741 10.6949H7.9878C7.82599 10.676 7.6757 10.6016 7.56242 10.4846C7.44913 10.3675 7.37982 10.2148 7.36623 10.0525C7.35265 9.89011 7.39562 9.72805 7.48786 9.59376C7.5801 9.45947 7.71595 9.36121 7.87236 9.31563C8.065 9.2848 8.2607 9.27775 8.45505 9.29464H15.1215C15.342 9.27508 15.5641 9.29471 15.7777 9.35261C15.9429 9.42989 16.0723 9.56736 16.1395 9.73691L16.18 9.90532ZM16.099 14.4364C16.1136 14.61 16.0623 14.7827 15.9553 14.9202C15.8484 15.0577 15.6936 15.1499 15.5218 15.1785L14.5773 15.184H8.95179C8.12773 15.184 7.49106 15.2965 7.36713 14.5684C7.34882 14.4283 7.37634 14.2861 7.44559 14.1631C7.70345 13.6588 8.32462 13.7838 9.05174 13.7838H14.3554C14.8206 13.7291 15.2919 13.7595 15.7462 13.8737C15.8969 13.9623 16.0105 14.1023 16.066 14.268L16.099 14.4364ZM16.3034 5.41619C16.319 5.5525 16.2951 5.69041 16.2346 5.81355C16.1741 5.93668 16.0795 6.03986 15.9621 6.11082C15.5362 6.2336 15.0894 6.26577 14.6503 6.20527H8.85334C8.05726 6.20527 7.48657 6.28373 7.36813 5.5846C7.34982 5.44458 7.37734 5.30239 7.44659 5.17932C7.68596 4.71506 8.1892 4.80002 8.86884 4.80002H14.9156C15.2475 4.76631 15.5827 4.78775 15.9076 4.86348C16.0714 4.94107 16.1992 5.07866 16.2644 5.24778L16.3034 5.41619ZM4.51064 4.50817C4.70831 4.50817 4.90155 4.56679 5.06591 4.67661C5.23028 4.78644 5.35838 4.94253 5.43403 5.12516C5.50968 5.30779 5.52947 5.50875 5.4909 5.70263C5.45234 5.89651 5.35715 6.0746 5.21737 6.21438C5.07759 6.35415 4.8995 6.44935 4.70562 6.48791C4.51174 6.52647 4.31078 6.50668 4.12815 6.43103C3.94552 6.35539 3.78943 6.22728 3.67961 6.06292C3.56978 5.89856 3.51116 5.70532 3.51116 5.50764C3.51116 5.37639 3.53702 5.24642 3.58724 5.12516C3.63747 5.0039 3.71109 4.89372 3.8039 4.80091C3.89671 4.7081 4.00689 4.63448 4.12815 4.58425C4.24942 4.53402 4.37938 4.50817 4.51064 4.50817ZM4.51064 9.0058C4.70831 9.0058 4.90155 9.06441 5.06591 9.17424C5.23028 9.28406 5.35838 9.44016 5.43403 9.62279C5.50968 9.80542 5.52947 10.0064 5.4909 10.2003C5.45234 10.3941 5.35715 10.5722 5.21737 10.712C5.07759 10.8518 4.8995 10.947 4.70562 10.9855C4.51174 11.0241 4.31078 11.0043 4.12815 10.9287C3.94552 10.853 3.78943 10.7249 3.67961 10.5605C3.56978 10.3962 3.51116 10.2029 3.51116 10.0053C3.51116 9.87402 3.53702 9.74405 3.58724 9.62279C3.63747 9.50152 3.71109 9.39134 3.8039 9.29853C3.89671 9.20572 4.00689 9.1321 4.12815 9.08188C4.24942 9.03165 4.37938 9.0058 4.51064 9.0058ZM4.51064 13.5034C4.70831 13.5034 4.90155 13.562 5.06591 13.6719C5.23028 13.7817 5.35838 13.9378 5.43403 14.1204C5.50968 14.303 5.52947 14.504 5.4909 14.6979C5.45234 14.8918 5.35715 15.0698 5.21737 15.2096C5.07759 15.3494 4.8995 15.4446 4.70562 15.4832C4.51174 15.5217 4.31078 15.5019 4.12815 15.4263C3.94552 15.3506 3.78943 15.2225 3.67961 15.0582C3.56978 14.8938 3.51116 14.7006 3.51116 14.5029C3.51116 14.3716 3.53702 14.2417 3.58724 14.1204C3.63747 13.9992 3.71109 13.889 3.8039 13.7962C3.89671 13.7034 4.00689 13.6297 4.12815 13.5795C4.24942 13.5293 4.37938 13.5034 4.51064 13.5034Z"></path>
          </g>
          <defs>
            <clipPath id="clip0_8741_74">
              <rect width="20" height="20" fill="white"></rect>
            </clipPath>
          </defs>
        </svg>
        <span style="color: #15C4FE; font-family: 'Poppins'; font-weight: 600;">On this Page</span>
      `;
      title.style.cssText = `
        padding-top: 1rem;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      toc.insertBefore(title, toc.firstChild);
      container.appendChild(toc);
      this.tableOfContentsContainer = container;
      const targetContainer = document.getElementById(containerId);
      if (targetContainer) {
        targetContainer.appendChild(container);
      } else {
        document.body.insertBefore(container, document.body.firstChild);
      }
      
  }
}

if (!window.customElements.get('article-table-of-contents')) {
  customElements.define('article-table-of-contents', ArticleTableOfContents);
}