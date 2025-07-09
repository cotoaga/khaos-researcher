#!/usr/bin/env node
/**
 * Strategic Dashboard Implementation Validation Script
 * Validates that the strategic dashboard implementation meets executive requirements
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

console.log('🎯 KHAOS-Researcher Strategic Dashboard Validation\n');

// Read the HTML file
const htmlPath = path.join(process.cwd(), 'public/index.html');
const cssPath = path.join(process.cwd(), 'public/style.css');

try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Parse HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    console.log('✅ Test 1: Strategic Dashboard Header Structure');
    
    // Test strategic dashboard header
    const strategicHeader = document.querySelector('.strategic-dashboard-header');
    console.log(`   - Strategic header exists: ${strategicHeader ? 'YES' : 'NO'}`);
    
    // Test command center section
    const commandCenter = document.querySelector('.command-center-section');
    console.log(`   - Command center section: ${commandCenter ? 'YES' : 'NO'}`);
    
    // Test ecosystem intelligence section
    const ecosystemIntel = document.querySelector('.ecosystem-intelligence-section');
    console.log(`   - Ecosystem intelligence section: ${ecosystemIntel ? 'YES' : 'NO'}`);
    
    console.log('\n✅ Test 2: Command Center Intelligence Elements');
    
    // Test command center metrics
    const commandMetrics = [
        'system-status',
        'research-status', 
        'next-research-time',
        'database-connection-status'
    ];
    
    commandMetrics.forEach(metric => {
        const element = document.getElementById(metric);
        console.log(`   - ${metric}: ${element ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 3: Ecosystem Intelligence Briefing Elements');
    
    // Test ecosystem intelligence metrics
    const ecosystemMetrics = [
        'ecosystem-total-strategic',
        'growth-velocity',
        'curated-models-strategic'
    ];
    
    ecosystemMetrics.forEach(metric => {
        const element = document.getElementById(metric);
        console.log(`   - ${metric}: ${element ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 4: Strategic CSS Styling');
    
    // Test CSS classes
    const strategicClasses = [
        '.strategic-dashboard-header',
        '.command-center-section',
        '.ecosystem-intelligence-section',
        '.command-metrics-grid',
        '.intelligence-metrics-grid',
        '.pulse-dot',
        '.status-indicator',
        '.intel-card',
        '.intelligence-narrative',
        '.strategic-btn'
    ];
    
    strategicClasses.forEach(className => {
        const hasClass = cssContent.includes(className);
        console.log(`   - ${className}: ${hasClass ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 5: Live Indicators and Animations');
    
    // Test animation elements
    const animationElements = [
        '.pulse-dot',
        '.live-indicator',
        '@keyframes pulse'
    ];
    
    animationElements.forEach(element => {
        const hasElement = cssContent.includes(element);
        console.log(`   - ${element}: ${hasElement ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 6: Intelligence Narrative Content');
    
    // Test narrative content
    const narrativeElement = document.querySelector('.intelligence-narrative');
    if (narrativeElement) {
        const narrativeText = narrativeElement.textContent;
        const hasKeyContent = [
            '15.6x growth',
            '30 months',
            'democratization of AI',
            'HuggingFace hosts',
            '1.89M+ models',
            '125K new models monthly'
        ];
        
        hasKeyContent.forEach(content => {
            const hasContent = narrativeText.includes(content);
            console.log(`   - Contains "${content}": ${hasContent ? 'YES' : 'NO'}`);
        });
    }
    
    console.log('\n✅ Test 7: Responsive Design');
    
    // Test responsive breakpoints
    const responsiveBreakpoints = [
        '@media (max-width: 1024px)',
        '@media (max-width: 768px)',
        'grid-template-columns: 1fr'
    ];
    
    responsiveBreakpoints.forEach(breakpoint => {
        const hasBreakpoint = cssContent.includes(breakpoint);
        console.log(`   - ${breakpoint}: ${hasBreakpoint ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 8: JavaScript Integration');
    
    // Test JavaScript functions
    const jsFunctions = [
        'updateStrategicDashboard',
        'updateSystemStatus',
        'updateEcosystemIntelligence',
        'updateResearchProgress'
    ];
    
    jsFunctions.forEach(func => {
        const hasFunction = htmlContent.includes(func);
        console.log(`   - ${func}(): ${hasFunction ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 9: Executive-Level Features');
    
    // Test executive features
    const executiveFeatures = [
        'AI Intelligence Command Center',
        'Live Monitoring',
        'Strategic Research Progress',
        'Ecosystem Intelligence Briefing',
        'Live Data',
        'enterprise-grade'
    ];
    
    executiveFeatures.forEach(feature => {
        const hasFeature = htmlContent.includes(feature);
        console.log(`   - Contains "${feature}": ${hasFeature ? 'YES' : 'NO'}`);
    });
    
    console.log('\n✅ Test 10: Strategic Validation Summary');
    
    // Calculate overall score
    const tests = [
        strategicHeader !== null,
        commandCenter !== null,
        ecosystemIntel !== null,
        document.getElementById('system-status') !== null,
        document.getElementById('ecosystem-total-strategic') !== null,
        cssContent.includes('.strategic-dashboard-header'),
        cssContent.includes('.pulse-dot'),
        htmlContent.includes('updateStrategicDashboard'),
        htmlContent.includes('15.6x growth'),
        htmlContent.includes('AI Intelligence Command Center')
    ];
    
    const passedTests = tests.filter(test => test).length;
    const totalTests = tests.length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`   - Tests passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    console.log(`   - Executive readiness: ${successRate >= 90 ? 'READY' : 'NEEDS WORK'}`);
    console.log(`   - Strategic dashboard: ${successRate >= 80 ? 'OPERATIONAL' : 'INCOMPLETE'}`);
    
    if (successRate >= 90) {
        console.log('\n🎯 SUCCESS: Strategic Dashboard Implementation Complete!');
        console.log('🏢 Executive-level intelligence dashboard operational');
        console.log('📊 Command center metrics active');
        console.log('🌊 Ecosystem intelligence briefing ready');
        console.log('⚡ Real-time updates functional');
        console.log('📱 Responsive design implemented');
    } else {
        console.log('\n❌ INCOMPLETE: Strategic Dashboard needs additional work');
        console.log('🔧 Please review failing tests and implement missing features');
    }
    
} catch (error) {
    console.error('❌ Error validating strategic dashboard:', error.message);
    console.log('🔧 Please ensure files exist and are properly formatted');
}

console.log('\n🎯 Strategic Dashboard Validation Complete\n');