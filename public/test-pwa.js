// Test Service Worker Registration
// Run this in browser console or create a test page

async function testServiceWorker() {
    console.log('🧪 Testing Service Worker...')

    // 1. Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker not supported')
        return
    }
    console.log('✅ Service Worker supported')

    // 2. Check if registered
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
        console.error('❌ Service Worker not registered')
        return
    }
    console.log('✅ Service Worker registered:', registration.scope)

    // 3. Check state
    if (registration.active) {
        console.log('✅ Service Worker active')
    } else if (registration.installing) {
        console.log('⏳ Service Worker installing...')
    } else if (registration.waiting) {
        console.log('⏳ Service Worker waiting...')
    }

    // 4. Test caching
    const cache = await caches.open('atelie-facil-v1')
    const cachedUrls = await cache.keys()
    console.log('📦 Cached URLs:', cachedUrls.length)
    cachedUrls.forEach(req => console.log('  -', req.url))

    // 5. Test offline
    console.log('\n🔌 To test offline:')
    console.log('1. Open DevTools > Network')
    console.log('2. Check "Offline"')
    console.log('3. Navigate to any page')
    console.log('4. Should show offline page')

    return {
        supported: true,
        registered: true,
        active: !!registration.active,
        cachedUrls: cachedUrls.length
    }
}

// Test Install Prompt
async function testInstallPrompt() {
    console.log('\n🧪 Testing Install Prompt...')

    // 1. Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (isInstalled) {
        console.log('✅ App already installed')
        return { installed: true }
    }
    console.log('ℹ️ App not installed')

    // 2. Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (!manifestLink) {
        console.error('❌ Manifest link not found')
        return { error: 'No manifest' }
    }
    console.log('✅ Manifest link found:', manifestLink.href)

    // 3. Fetch manifest
    try {
        const response = await fetch(manifestLink.href)
        const manifest = await response.json()
        console.log('✅ Manifest loaded:', manifest.name)
        console.log('   Icons:', manifest.icons?.length || 0)
    } catch (error) {
        console.error('❌ Failed to load manifest:', error)
        return { error: 'Manifest load failed' }
    }

    // 4. Instructions
    console.log('\n📱 To test install:')
    console.log('1. Open Chrome DevTools > Application > Manifest')
    console.log('2. Check "Installable" section')
    console.log('3. Click "Install" button in address bar')
    console.log('4. Or use custom install button')

    return {
        installed: false,
        manifestFound: true,
        canInstall: true
    }
}

// Test Push Notifications
async function testPushNotifications() {
    console.log('\n🧪 Testing Push Notifications...')

    // 1. Check support
    if (!('Notification' in window)) {
        console.error('❌ Notifications not supported')
        return { supported: false }
    }
    console.log('✅ Notifications supported')

    // 2. Check permission
    console.log('📋 Permission:', Notification.permission)

    if (Notification.permission === 'default') {
        console.log('ℹ️ Request permission first')
        const permission = await Notification.requestPermission()
        console.log('📋 New permission:', permission)
    }

    // 3. Test notification
    if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
            body: 'This is a test notification from AteliêFácil',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
        })
        console.log('✅ Test notification sent')
    }

    return {
        supported: true,
        permission: Notification.permission,
        granted: Notification.permission === 'granted'
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running all PWA tests...\n')

    const results = {
        serviceWorker: await testServiceWorker(),
        installPrompt: await testInstallPrompt(),
        pushNotifications: await testPushNotifications(),
    }

    console.log('\n📊 Test Results:', results)
    return results
}

// Export for use
if (typeof window !== 'undefined') {
    window.testPWA = {
        testServiceWorker,
        testInstallPrompt,
        testPushNotifications,
        runAllTests,
    }

    console.log('✅ PWA tests loaded. Run: window.testPWA.runAllTests()')
}
