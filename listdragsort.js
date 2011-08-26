/**
 * 多行列元素拖拽排序
 * 
 * @author jintian.zhengjt
 */

AE.namespace('AE.app');

AE.app.dragSort = (function(){
	
	// 内部配置对象，提供多个默认参数
	var _config = {
			// 需要进行排序的元素id
			target : 'drag-list' ,
			
			// 每次排序完成时的回调
			onSort : function(dragSort){
				
			},
			currentClass : 'current' ,
			movingClass : 'moving' 
		},
		// 需要进行排序的元素其他元素的容器
		_wrapper ,
		
		// 拖拽对象父容器
		_container,
		
		// 需要进行排序的元素礼盒
		_targets,
		
		// 正主域拖拽状态的元素
		_currentEl,
		
		//当时是否正在拖拽的标志
		_procressing = 0,
		
		// 用于排序中被替换的元素
		_elForRepalce,
		
		// 当前拖拽元素的拷贝
		__itemClone,
		
		// 当前移动元素的x坐标(left值)
		_curX,
		// 当前移动元素的y坐标(top值)
		_curY,
		// 元素开始移动时的x坐标
		_startX,
		// 元素开始移动时的y坐标
		_startY,
		
		/**
		 * 按照指定鼠标的坐标移动指定元素
		 * 
		 * @param {Object} el 需要移动的元素
		 * @param {Object} x 当前鼠标x坐标(e.pageX)
		 * @param {Object} y 当前鼠标y坐标(e.pageY)
		 */
		_move =  function(el, x, y){
			// 计算移动到指定位置的坐标，由当前位置 + 偏移量组成
			var targetX = parseInt(_curX + x - _startX) ,
				targetY = parseInt(_curY + y - _startY);
			YUD.setStyle(el,'left',targetX + 'px');
			YUD.setStyle(el,'top',targetY + 'px');
		},
		/**
		 * 充值每个拖拽元素的状态
		 */
		_resetItems = function(){
			// 重新获取拖拽对象是为了能够重置每个元素的cid
			var _targets = YUD.getChildren(_container);
			// 为每个拖拽元素添加当前的位置信息
			for(var i = _targets.length; i--;){
				_targets[i].region = YUD.getRegion(_targets[i]);
				_targets[i].removeAttribute('cid');
				_targets[i].setAttribute('cid', i);
			}			
		},
		/**
		 * 重置元素至指定坐标的位置
		 * 
		 * @param {Object} el 重置的元素
		 */
		_locate = function(el,toLeft,toTop,onFinish){
			var left = YUD.getStyle(el,'left'),
				top = YUD.getStyle(el,'top');
			
			// 由于YUI动画太耗资源在IE6下不适用
//			if(AE.bom.isIE6){
				YUD.setStyle(el,'left',toLeft);
				YUD.setStyle(el,'top',toLeft);
				if(AE.bom.isIE6 || AE.bom.isIE7){
						YUD.setStyle(el,'text-indent',parseInt(100 * Math.random()) + 'px');
						YUD.setStyle(el,'text-indent',0);	
					}			
					
				YUD.setStyle(_currentEl,'opacity',1);	
				onFinish();
//			}else{				
//				// 复位使用动画效果
//				var anim = new YAHOO.util.Anim(el, {
//				    left: {to: toLeft},
//					top: {to: toTop} 
//				}, 0.3, YAHOO.util.Easing.easeOut);
//				anim.onComplete.subscribe(function(){
//					// IE6 IE7下元素复位有bug，需要让dom reflow来hack
//					if(AE.bom.isIE6 || AE.bom.isIE7){
//						YUD.setStyle(el,'text-indent',parseInt(100 * Math.random()) + 'px');
//						YUD.setStyle(el,'text-indent',0);	
//					}			
//						
//					anim = null;
//					delete anim;
//					onFinish();
//				});
//		 		anim.animate();
//			}
		},
		
		/**
		 * 判断该元素应该被移动到哪个位置
		 * 并且重新对元素进行排序
		 * @param {Object} dragEl
		 */
		_findReplaceEl = function(dragEl){
			var dragRegion = YUD.getRegion(dragEl),
				centerFocus ={
					x : (dragRegion.right + dragRegion.left) / 2 ,
					y : (dragRegion.top + dragRegion.bottom) / 2 
				},
				targetEl,
				
				// 重新获取拖拽对象是为了重新对数组按正确的顺序进行排序
				_targets = YUD.getChildren(_container);

				for(var i = _targets.length;i--;){
					if(_targets[i] === _currentEl){
						continue;
					}
					var region = _targets[i].region;
					// 通过当前拖拽元素的中心点坐标判断当前拖拽动作是否寻找到替换的目标
					if(centerFocus.x > region.left && centerFocus.x < region.right && centerFocus.y < region.bottom && centerFocus.y > region.top){
						//如果找到了，就缓存起来
						_elForRepalce =  _targets[i];
						break;
					}else{
						// 否则清空
						_elForRepalce = null;
					}
				}
		},

		/**
		 * 将需要替换的元素插入至指定位置
		 * @param {Object} dragEl 当前拖拽的元素
		 * @param {Object} targetEl 需替换的指定元素
		 */
		_sort = function(dragEl, targetEl){
				// 替换目标的索引
			var targetIndex = parseInt(_elForRepalce.getAttribute('cid')),
				//当前拖拽元素的索引
				dragIndex = parseInt(dragEl.getAttribute('cid')),
				_targets = YUD.getChildren(_container);
			if(targetIndex === _targets.length - 1){
				_container.appendChild(dragEl);
			}
			// 如果目标元素的索引值小于当前拖拽元素的索引
			else if(targetIndex < dragIndex){
				//将元素插入到目标元素的前面
				YUD.insertBefore(dragEl,targetEl);
			}else{
				YUD.insertBefore(dragEl,_targets[targetIndex + 1]);
			}
			// 重置所有拖拽元素的索引
			_resetItems();
		},
		
		/**
		 * 复制拖拽的元素
		 */
		_createClone = function(){	
			_itemClone = document.createElement('ul');
			_itemClone.innerHTML = '';
			YUD.addClass(_itemClone,'drag-item item-clone clearfix');			
			_wrapper.appendChild(_itemClone);
		},
		
		/**
		 * 更新复制出来的拖拽元素
		 */
		_updateClone = function(){
			_itemClone.appendChild(_currentEl.cloneNode(true));
			// 将克隆出来的拖拽元素定位到鼠标坐标点			
			_relocate(_itemClone,_currentEl);
		},
		
		/**
		 *  重新定位站位标签
		 * @param {Object} el 定位占位符的目标元素
		 */
		_relocate = function(dragEl,targetEl){		
			YUD.setStyle(dragEl , 'left',( targetEl.region.left - _container.region.left ) + 'px');
			YUD.setStyle(dragEl , 'top',(targetEl.region.top - _container.region.top  ) + 'px');
		},
		
		/**
		 * 为拖拽元素绑定必要的事件
		 */
		liveEvent = function(){
			
			// 缓存某个元素是否已经被占位符重新替换过。
			var itemHasReplaced ,
				stopMoving = 0;
			
			// 拖拽开始的时候记录当前处理的元素
			// 计算拖拽开始的坐标和当前元素的位置
			YUE.on(_targets , 'mousedown',function(e){
				YUE.preventDefault(e);
				
				_currentEl = this;
				// 缓存当前的鼠标位置
				_startX = e.pageX || e.clientX;
				_startY = e.pageY || e.clientY;
				
				_procressing = 1;
				// 创建克隆的拖拽元素
				_updateClone();
				
				_curX = parseInt(YUD.getStyle(_itemClone,'left') || 0);
				_curY = parseInt(YUD.getStyle(_itemClone,'top') || 0);
				
				// 将当前拖拽的元素置为半透明
				YUD.setStyle(_currentEl,'opacity','0.3');
				stopMoving = 0;
			});
			
			 
			// 拖拽进行中，根据鼠标移动的位置移动对应的元素
			YUE.on(document , 'mousemove',function(e){
				if(!_currentEl || stopMoving){
					return;
				}
				YUE.preventDefault(e);
				
				YUD.removeClass(_targets , _config.currentClass );
				if(!YUD.hasClass(_currentEl,_config.movingClass)){
					YUD.addClass(_currentEl , _config.currentClass + ' ' + _config.movingClass );					
				}
				// 获取鼠标的当前x y坐标
				var x = e.pageX || e.clientX ,
					y = e.pageY || e.clientY,
					// 获取容器的位置信息
					region = _container.region,
					hasReplaced;
					
				//判断当前拖拽容器的中心是否在容器范围之内		
				
				if(x < region.right && x > region.left && y > region.top && y < region.bottom){
					_move(_itemClone,x,y);
					_findReplaceEl(_itemClone);
					// 如果找到了可以替换位置的元素
					if(_elForRepalce ){
						itemHasReplaced = _elForRepalce;
						_sort(_currentEl,_elForRepalce);
					};
				}
			});
			
			// 拖拽结束的时候重新设置当前元素为空
			YUE.on(document , 'mouseup',function(e){
				if(!_currentEl){
					return;
				}
				YUE.preventDefault(e);
				stopMoving = 1;
				// 将克隆元素通过动画定位到目标元素的位置
				_locate(_itemClone,
					_currentEl.region.left - _container.region.left,
					_currentEl.region.top - _container.region.top,
					function(){

						// 清空复制的元素
						_itemClone.innerHTML = '';
						YUD.removeClass(_currentEl , _config.movingClass );
						setTimeout(function(){
							YUD.setStyle(_currentEl,'opacity',1);
							// 清空当前移动的元素
							_currentEl = null;
						},1);
						
					});
				
				// 清空占位符缓存元素
				itemHasReplaced = null;
			});
		},
		
		/**
		 * 初始化拖拽，计算容器边界左边数据
		 */
		_initialize = function(){
			
			// 获取拖拽元素和容器
			_wrapper = get(_config.wrapper),
			_container = get(_config.itemContainer);
			_targets = YUD.getChildren(_container);
			
			// 缓存坐标信息
			_container.region = YUD.getRegion(_container);
			
			// 为拖拽元素建立自定义的索引
			_resetItems();
			
			//创建复制的拖拽元素
			_createClone();
			
			// 绑定所有事件
			liveEvent();
			
			this.container = _container;
		};
		
	
	return {
		// 为拖拽排序进行必要的初始化，缓存dom，处理事件绑定
		init : function(customConfig){
			_config = YL.merge(_config , customConfig || {});
			
			_initialize();	
		},
		getOrder : function(){
			if(_config.getOrder){
				_config.getOrder.apply(this);
				return;
			}
			return _container;
		}
	}
})();
