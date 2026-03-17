async function testRoadmap() {
    console.log('Testing Roadmap Generator API endpoint...');
    const result = await fetch('http://localhost:3000/api/ai/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: 'Create a structured learning roadmap for the role: AI Engineer. Output ONLY valid JSON in this format: { "roadmap": [ { "phase": "Phase 1: Foundations", "title": "Web Basics", "desc": "Learn HTML, CSS, JavaScript", "topics": ["HTML5", "CSS3", "JS"] } ] }'
        })
    });
    
    if (!result.ok) {
        console.error('API Error:', result.status, await result.text());
        process.exit(1);
    }
    
    const data = await result.json();
    console.log(JSON.stringify(data, null, 2));
}

testRoadmap();
