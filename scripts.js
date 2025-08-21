/* Shared behaviors for CampusPlacement portal */
(function(){
	// Current year
	var yearEl=document.getElementById('year');
	if(yearEl){yearEl.textContent=new Date().getFullYear();}

	// Lightbox overlay (single instance)
	var lightbox=document.createElement('div');
	lightbox.className='lightbox';
	lightbox.innerHTML='<img alt="Expanded image" />';
	document.body.appendChild(lightbox);

	function openLightbox(src){
		var img=lightbox.querySelector('img');
		img.src=src;
		lightbox.classList.add('open');
	}
	function closeLightbox(){
		lightbox.classList.remove('open');
	}
	lightbox.addEventListener('click', closeLightbox);
	window.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeLightbox(); }});

	// Gallery upload and preview
	function initializeGalleryUpload(){
		var input=document.getElementById('gallery-upload');
		var grid=document.querySelector('.gallery-grid');
		if(!input || !grid){return;}

		function addImageToGrid(src){
			var item=document.createElement('div');
			item.className='gallery-item';
			var img=document.createElement('img');
			img.src=src;
			img.alt='Gallery image';
			img.loading='lazy';
			img.addEventListener('click', function(){ openLightbox(src); });
			var viewBtn=document.createElement('button');
			viewBtn.type='button';
			viewBtn.innerHTML='<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
			viewBtn.addEventListener('click', function(){ openLightbox(src); });
			item.appendChild(img);
			item.appendChild(viewBtn);
			grid.prepend(item);
		}

		input.addEventListener('change', function(){
			var files=Array.prototype.slice.call(input.files||[]);
			files.forEach(function(file){
				if(!file.type.startsWith('image/')) return;
				var url=URL.createObjectURL(file);
				addImageToGrid(url);
			});
			input.value='';
		});
	}

	function bindExistingGalleryItems(){
		var grid=document.querySelector('.gallery-grid');
		if(!grid){return;}
		Array.prototype.forEach.call(grid.querySelectorAll('img'), function(img){
			img.addEventListener('click', function(){ openLightbox(img.src); });
		});
	}

	// Enhance recruiter ticker on hover (pause)
	function initializeTicker(){
		var track=document.querySelector('.ticker-track');
		if(!track){return;}
		track.addEventListener('mouseenter', function(){ track.style.animationPlayState='paused'; });
		track.addEventListener('mouseleave', function(){ track.style.animationPlayState='running'; });
	}

	document.addEventListener('DOMContentLoaded', function(){
		initializeGalleryUpload();
		bindExistingGalleryItems();
		initializeTicker();
	});
})();