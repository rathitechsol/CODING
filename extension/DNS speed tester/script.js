class DNSSpeedTest {
    constructor() {
        this.providers = [
            { name: 'Cloudflare', url: 'https://1.1.1.1/dns-query', selected: true },
            { name: 'Google Public DNS', url: 'https://8.8.8.8/dns-query', selected: true },
            { name: 'Quad9', url: 'https://9.9.9.9:5053/dns-query', selected: true },
            { name: 'OpenDNS', url: 'https://208.67.222.222/dns-query', selected: true },
            { name: 'CleanBrowsing', url: 'https://185.228.168.9/dns-query', selected: false },
            { name: 'AdGuard DNS', url: 'https://94.140.14.14/dns-query', selected: false }
        ];
        
        this.testDomains = [
            'example.com',
            'google.com',
            'github.com',
            'stackoverflow.com',
            'wikipedia.org'
        ];
        
        this.uncachedDomains = [
            'test-uncached-1.example.com',
            'test-uncached-2.example.com',
            'test-uncached-3.example.com',
            'random-test-domain-1.com',
            'random-test-domain-2.com'
        ];
        
        this.isRunning = false;
        this.currentResults = new Map();
        this.sortColumn = 'median';
        this.sortDirection = 'asc';
        
        this.initializeUI();
        this.bindEvents();
        this.renderProviders();
    }
    
    initializeUI() {
        this.elements = {
            startTest: document.getElementById('startTest'),
            stopTest: document.getElementById('stopTest'),
            exportResults: document.getElementById('exportResults'),
            testStatus: document.getElementById('testStatus'),
            progressBar: document.getElementById('progressFill'),
            providerList: document.getElementById('providerList'),
            resultsTable: document.getElementById('resultsTable'),
            resultsBody: document.getElementById('resultsBody'),
            resultsInfo: document.getElementById('resultsInfo'),
            testProfile: document.getElementById('testProfile'),
            testMode: document.getElementById('testMode'),
            concurrency: document.getElementById('concurrency')
        };
    }
    
    bindEvents() {
        this.elements.startTest.addEventListener('click', () => this.startTest());
        this.elements.stopTest.addEventListener('click', () => this.stopTest());
        this.elements.exportResults.addEventListener('click', () => this.exportResults());
        
        document.getElementById('selectAll').addEventListener('click', () => this.selectAllProviders(true));
        document.getElementById('selectNone').addEventListener('click', () => this.selectAllProviders(false));
        document.getElementById('addCustom').addEventListener('click', () => this.addCustomProvider());
        document.getElementById('clearResults').addEventListener('click', () => this.clearResults());
        
        // Table sorting
        this.elements.resultsTable.addEventListener('click', (e) => {
            if (e.target.tagName === 'TH' && e.target.dataset.sort) {
                this.sortResults(e.target.dataset.sort);
            }
        });
    }
    
    renderProviders() {
        this.elements.providerList.innerHTML = this.providers.map((provider, index) => `
            <div class="provider-item">
                <input type="checkbox" id="provider-${index}" ${provider.selected ? 'checked' : ''} 
                       onchange="dnsTest.toggleProvider(${index})">
                <div class="provider-info">
                    <div class="provider-name">${provider.name}</div>
                    <div class="provider-url">${provider.url}</div>
                </div>
                <button class="btn-small" onclick="dnsTest.removeProvider(${index})" 
                        ${index < 6 ? 'style="display:none"' : ''}>Remove</button>
            </div>
        `).join('');
    }
    
    toggleProvider(index) {
        this.providers[index].selected = !this.providers[index].selected;
    }
    
    selectAllProviders(selected) {
        this.providers.forEach(provider => provider.selected = selected);
        this.renderProviders();
    }
    
    addCustomProvider() {
        const name = prompt('Enter provider name:');
        if (!name) return;
        
        const url = prompt('Enter DNS-over-HTTPS URL:');
        if (!url) return;
        
        if (!url.startsWith('https://')) {
            alert('URL must start with https://');
            return;
        }
        
        this.providers.push({ name, url, selected: true });
        this.renderProviders();
    }
    
    removeProvider(index) {
        if (index < 6) return; // Don't allow removing default providers
        this.providers.splice(index, 1);
        this.renderProviders();
    }
    
    async startTest() {
        const selectedProviders = this.providers.filter(p => p.selected);
        if (selectedProviders.length === 0) {
            alert('Please select at least one DNS provider to test.');
            return;
        }
        
        this.isRunning = true;
        this.updateUI();
        this.currentResults.clear();
        
        const profile = this.elements.testProfile.value;
        const mode = this.elements.testMode.value;
        const concurrency = parseInt(this.elements.concurrency.value);
        
        const trials = profile === 'quick' ? 3 : profile === 'balanced' ? 5 : 10;
        
        try {
            await this.runTests(selectedProviders, trials, mode, concurrency);
            this.setStatus('Test completed!', 'complete');
            this.elements.exportResults.disabled = false;
        } catch (error) {
            console.error('Test failed:', error);
            this.setStatus('Test failed. Please try again.', 'error');
        } finally {
            this.isRunning = false;
            this.updateUI();
        }
    }
    
    stopTest() {
        this.isRunning = false;
        this.setStatus('Test stopped by user', 'idle');
        this.updateUI();
    }
    
    async runTests(providers, trials, mode, concurrency) {
        const totalSteps = providers.length;
        let completedSteps = 0;
        
        // Process providers in batches based on concurrency setting
        for (let i = 0; i < providers.length; i += concurrency) {
            if (!this.isRunning) break;
            
            const batch = providers.slice(i, i + concurrency);
            const promises = batch.map(provider => this.testProvider(provider, trials, mode));
            
            await Promise.all(promises);
            
            completedSteps += batch.length;
            this.updateProgress(completedSteps / totalSteps * 100);
        }
        
        this.renderResults();
    }
    
    async testProvider(provider, trials, mode) {
        if (!this.isRunning) return;
        
        this.setProviderStatus(provider.name, 'Testing...', 'testing');
        
        try {
            // Warm-up requests
            await this.warmUpProvider(provider);
            
            const results = [];
            const domains = this.getTestDomains(mode);
            
            for (let i = 0; i < trials; i++) {
                if (!this.isRunning) break;
                
                const domain = domains[i % domains.length];
                const latency = await this.measureLatency(provider, domain);
                if (latency !== null) {
                    results.push(latency);
                }
                
                // Small delay between requests
                await this.sleep(100);
            }
            
            if (results.length > 0) {
                const stats = this.calculateStats(results);
                const successRate = (results.length / trials * 100).toFixed(1);
                
                this.currentResults.set(provider.name, {
                    provider: provider.name,
                    ...stats,
                    successRate,
                    status: 'Complete'
                });
                
                this.setProviderStatus(provider.name, 'Complete', 'complete');
            } else {
                this.setProviderStatus(provider.name, 'Failed', 'error');
            }
        } catch (error) {
            console.error(`Test failed for ${provider.name}:`, error);
            this.setProviderStatus(provider.name, 'Error', 'error');
        }
    }
    
    async warmUpProvider(provider) {
        // Send 2 warm-up requests to establish connection
        for (let i = 0; i < 2; i++) {
            try {
                await this.queryDNS(provider, 'example.com');
                await this.sleep(50);
            } catch (error) {
                // Ignore warm-up failures
            }
        }
    }
    
    async measureLatency(provider, domain) {
        const start = performance.now();
        try {
            await this.queryDNS(provider, domain);
            const end = performance.now();
            return Math.round((end - start) * 10) / 10; // Round to 1 decimal
        } catch (error) {
            console.warn(`Query failed for ${provider.name} - ${domain}:`, error);
            return null;
        }
    }
    
    async queryDNS(provider, domain) {
        const url = `${provider.url}?name=${domain}&type=A`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/dns-message'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.arrayBuffer();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    getTestDomains(mode) {
        switch (mode) {
            case 'cached':
                return this.testDomains;
            case 'uncached':
                return this.uncachedDomains;
            case 'mixed':
            default:
                return [...this.testDomains, ...this.uncachedDomains];
        }
    }
    
    calculateStats(times) {
        if (times.length === 0) return { min: 0, median: 0, avg: 0, max: 0 };
        
        const sorted = [...times].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const avg = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length * 10) / 10;
        
        let median;
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            median = Math.round((sorted[mid - 1] + sorted[mid]) / 2 * 10) / 10;
        } else {
            median = sorted[mid];
        }
        
        return { min, median, avg, max };
    }
    
    renderResults() {
        const results = Array.from(this.currentResults.values());
        
        if (results.length === 0) {
            this.elements.resultsBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No results yet</td></tr>';
            this.elements.resultsInfo.textContent = 'No tests completed yet';
            return;
        }
        
        // Sort results
        results.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            
            if (this.sortColumn === 'provider') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            } else if (this.sortColumn === 'successRate') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            if (this.sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
        
        // Find fastest (lowest median)
        const fastestResult = results.reduce((prev, current) => 
            (prev.median < current.median) ? prev : current
        );
        
        this.elements.resultsBody.innerHTML = results.map(result => `
            <tr ${result === fastestResult ? 'class="fastest"' : ''}>
                <td>${result.provider}</td>
                <td>${result.min}ms</td>
                <td>${result.median}ms</td>
                <td>${result.avg}ms</td>
                <td>${result.max}ms</td>
                <td>${result.successRate}%</td>
                <td class="status-${result.status.toLowerCase()}-cell">${result.status}</td>
            </tr>
        `).join('');
        
        this.elements.resultsInfo.textContent = `${results.length} provider(s) tested • Fastest: ${fastestResult.provider} (${fastestResult.median}ms median)`;
    }
    
    sortResults(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Update table headers
        document.querySelectorAll('th[data-sort]').forEach(th => {
            const arrow = th.dataset.sort === this.sortColumn 
                ? (this.sortDirection === 'asc' ? ' 🔼' : ' 🔽')
                : ' 🔽';
            th.textContent = th.textContent.replace(/ 🔼| 🔽/g, '') + arrow;
        });
        
        this.renderResults();
    }
    
    clearResults() {
        this.currentResults.clear();
        this.renderResults();
        this.elements.exportResults.disabled = true;
        this.setStatus('Results cleared', 'idle');
    }
    
    exportResults() {
        if (this.currentResults.size === 0) return;
        
        const results = Array.from(this.currentResults.values());
        const csv = [
            'Provider,Min (ms),Median (ms),Avg (ms),Max (ms),Success Rate (%)',
            ...results.map(r => `${r.provider},${r.min},${r.median},${r.avg},${r.max},${r.successRate}`)
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dns-speed-test-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    setStatus(message, type) {
        this.elements.testStatus.textContent = message;
        this.elements.testStatus.className = `status-${type}`;
    }
    
    setProviderStatus(providerName, status, type) {
        // This would update individual provider status if we had that UI element
        console.log(`${providerName}: ${status}`);
    }
    
    updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
    }
    
    updateUI() {
        this.elements.startTest.disabled = this.isRunning;
        this.elements.stopTest.disabled = !this.isRunning;
        
        if (this.isRunning) {
            this.setStatus('Running DNS speed tests...', 'testing');
            this.updateProgress(0);
        } else {
            this.updateProgress(0);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the DNS Speed Test when the page loads
let dnsTest;
document.addEventListener('DOMContentLoaded', () => {
    dnsTest = new DNSSpeedTest();
});
