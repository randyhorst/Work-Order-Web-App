/**
 * checklists.js
 * All equipment checklist definitions. Preserved from the original index.html.
 */

export const checklists = {
    'kubota_svl': {
        name: 'Kubota SVL Series (Universal)',
        sections: [
            { title: 'Engine Service & Filters', items: ['Engine Oil & Filter (Replace)', 'Inner & Outer Air Filters (Check/Replace)', 'Fuel Filter & Water Separator (Replace)', 'Fan Belt Tension & Condition', 'Radiator & Oil Cooler (Clean Fins)'] },
            { title: 'Hydraulic System', items: ['Hydraulic Oil Level', 'Hydraulic Return Filter (Replace)', 'Hydraulic Suction Filter (Replace/Clean)', 'Hoses, Lines & Couplers (Leaks/Chafing)', 'Cylinder Rods (Nicks/Leaks)'] },
            { title: 'Undercarriage & Final Drives', items: ['Final Drive Oil (Check/Replace)', 'Track Tension (Adjustment)', 'Idlers, Rollers & Sprockets (Wear)', 'Clean debris from Track Frame'] },
            { title: 'General & Safety', items: ['Grease all Pivot Points (Bucket/Boom)', 'Quick Attach Pins & Engagement', 'Lights & Backup Alarm', 'Seatbelt & Operator Presence Interlock', 'Fire Extinguisher Charge'] }
        ]
    },
    'pickup': {
        name: 'Pickup Truck',
        sections: [
            { title: 'Under Hood', items: ['Engine Oil', 'Coolant Level', 'Power Steering Fluid', 'Brake Fluid', 'Transmission Oil Level', 'Belts & Hoses', 'Battery Terminals', 'Air Filter', 'Cabin Air Filter', 'Rads (Clean blown out)', 'Exhaust', 'Engine Light/Codes'] },
            { title: 'Drivetrain & Suspension', items: ['Transfer Case', 'Front Axle Seals', 'Rear Axle Seals', 'Driveline/U-Joints', 'Front Suspension', 'Shocks', 'U-bolts', 'Leafs', 'Wheel Bearings', 'Ball Joints'] },
            { title: 'Wheels & Brakes', items: ['Tire Pressure & Tread', 'Lug Nuts (Torque)', 'Spare Tire (present, aired up?)', 'Brake Pads/Rotors', 'Brake Life'] },
            { title: 'Exterior & Lighting', items: ['Lights (Head/Tail/Signal)', 'Windshield', 'Trailer Plug Test', 'Hitch', 'Decals/Logos'] },
            { title: 'Interior/Safety', items: ['Glass/Mirrors', 'Wipers Working, Washer Fluid Topped Up, Working', 'Horn', 'Seatbelts', 'Fire Extinguisher', 'First Aid', 'Cleaned Interior'] },
            { title: 'Field Readiness', items: ['Rigged for Field Work'] }
        ]
    },
    'sxs_spray': {
        name: 'SxS with Spray Tank',
        sections: [
            { title: 'General', items: ['Air Filter', 'Eng oil and filter', 'Fuel filters', 'Coolant', 'Front diff', 'Rear diff', 'Alternator belt', 'Park brake', 'Drive Belt (Deere 29mm width min.)', 'Battery and connections', 'Brakes', 'A-arms', 'Wheel bearings', 'Tie rods', 'Shocks', '4x4', 'Diff lock', 'Winch', 'Tires', 'Lights', 'Fire ext'] },
            { title: 'Tank', items: ['Electrical', 'Plumbing', 'Nozzles'] },
            { title: 'Honda Pump', items: ['Carb bowl clean', 'Air filter', 'Eng oil', 'Pull cord', 'Gearbox oil', 'Diaphragm pump oil'] }
        ]
    },
    'tractor': {
        name: 'Tractor',
        sections: [
            { title: 'Engine & Cooling', items: ['Engine Oil Level', 'Engine Oil & Filter Replace', 'Coolant Level & Radiator Screen', 'Air Filter (Inner/Outer)', 'Fuel Filter/Water Separator', 'Alternator/Fan Belt'] },
            { title: 'Transmission & Hydraulics', items: ['Transmission/Hydraulic Oil Level', 'Hydraulic Filter Replace', 'Front Axle Oil (4WD)', 'PTO Operation', '3-Point Hitch Operation'] },
            { title: 'Chassis & Safety', items: ['Wheel Bolts/Lug Nuts', 'Tire Pressure & Condition', 'Grease Points (Chassis/Loaders)', 'Brakes/Clutch Adjustment', 'Lights/Flashers/SMV Sign', 'Battery Connections'] }
        ]
    },
    'hydroseeder': {
        name: 'Hydroseeder',
        sections: [
            { title: '— SEMI TRUCK — Engine & Cab', items: ['Engine Oil Level', 'Coolant Level & Condition', 'Power Steering Fluid', 'Windshield Washer Fluid', 'Air Filter Restriction Indicator', 'Fan Belt & Serpentine Belt Condition', 'Battery Terminals & Charge', 'Fuel Level', 'Cab/Sleeper Mounts & Latches', 'Windshield & Mirrors (Clean/Unobstructed)', 'Horn', 'Wipers & Washers', 'Seatbelt & Cab Safety Equipment', 'Fire Extinguisher (Cab)', 'All Gauges & Warning Lights (Functional)'] },
            { title: '— SEMI TRUCK — Brakes & Suspension', items: ['Air Brake System – Build-up & Hold Test', 'Low Air Warning Buzzer/Light', 'Spring Brakes (Emergency/Parking)', 'Brake Lining & Drum/Rotor Condition', 'Slack Adjusters (Auto/Manual)', 'Air Lines & Glad Hands (Leaks/Chafing)', 'Front Steering Axle – King Pins & Tie Rods', 'Leaf Springs / Air Bags – Cracks or Leaks', 'Shock Absorbers', 'U-Bolts & Spring Hangers', 'Wheel Seals (No Leaks)'] },
            { title: '— SEMI TRUCK — Lights & Electrical', items: ['Headlights (High & Low Beam)', 'Tail Lights & Brake Lights', 'Turn Signals (Front & Rear)', 'Hazard/4-Way Flashers', 'Clearance & Marker Lights', 'Reverse/Backup Lights & Alarm', 'DOT Reflective Tape (Condition)', 'ABS Warning Light (Clears After Start)', '7-Pin Trailer Connector (Clean/Functional)', 'Tractor Protection Valve'] },
            { title: '— HYDROSEEDER SKID — Engine (Main)', items: ['Oil Level', 'Coolant', 'Air Filter', 'Fuel Filter'] },
            { title: '— HYDROSEEDER SKID — Pump System', items: ['Pump Oil', 'Agitator Bearings', 'Packing Seals', 'Hydraulic Hoses & Fittings', 'Valves operation'] },
            { title: '— HYDROSEEDER SKID — Trailer/Frame', items: ['Tires', 'Lights', 'Hitch/Chains', 'Breakaway Battery'] }
        ]
    }
};

export function renderChecklist(type, container, savedData = null, activeChecklists = null) {
    container.innerHTML = '';
    const source = activeChecklists || checklists;
    const data = source[type];
    if (!data) return;

    let customItemCounter = 0;

    data.sections.forEach((section, secIdx) => {
        const header = document.createElement('h3');
        header.className = 'text-indigo-300 font-bold uppercase text-xs mt-4 mb-2 tracking-wider';
        header.textContent = section.title;
        container.appendChild(header);

        section.items.forEach((item, itemIdx) => {
            const row = document.createElement('div');
            row.className = 'flex items-center space-x-3 mb-2 p-2 rounded bg-gray-750';
            const checkId = `chk-${type}-${secIdx}-${itemIdx}`;
            const noteId = `note-${type}-${secIdx}-${itemIdx}`;
            const savedItem = savedData?.sections?.[secIdx]?.items?.[itemIdx];
            const isChecked = savedItem?.checked ? 'checked' : '';
            const noteVal = savedItem?.notes || '';
            row.innerHTML = `
                <div class="flex-shrink-0"><input type="checkbox" id="${checkId}" ${isChecked} class="w-6 h-6 text-green-500 rounded bg-gray-600 border-gray-500"></div>
                <div class="flex-grow"><label for="${checkId}" class="text-sm text-white block">${item}</label></div>
                <div class="flex-grow w-1/2"><input type="text" id="${noteId}" value="${noteVal}" placeholder="Notes" class="w-full text-xs bg-gray-600 border-none rounded text-gray-200 py-1 px-2"></div>
            `;
            container.appendChild(row);
        });
    });

    // Custom Items Section
    const customHeader = document.createElement('h3');
    customHeader.className = 'text-yellow-400 font-bold uppercase text-xs mt-6 mb-2 tracking-wider';
    customHeader.textContent = 'Custom Items';
    container.appendChild(customHeader);

    const customContainer = document.createElement('div');
    customContainer.id = 'custom-items-container';
    customContainer.className = 'space-y-2';
    container.appendChild(customContainer);

    // Restore saved custom items
    if (savedData?.customItems?.length) {
        savedData.customItems.forEach(ci => {
            addCustomItemRow(customContainer, customItemCounter++, ci.name, ci.checked, ci.notes);
        });
    }

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2';
    addButton.innerHTML = '<span class="text-lg leading-none">+</span> Add Custom Item';
    addButton.onclick = () => addCustomItemRow(customContainer, customItemCounter++);
    container.appendChild(addButton);
}

function addCustomItemRow(container, idx, name = '', checked = false, notes = '') {
    const customId = `custom-${idx}`;
    const row = document.createElement('div');
    row.className = 'flex items-center space-x-3 mb-2 bg-gray-700 p-2 rounded border border-yellow-600';
    row.id = `custom-row-${customId}`;
    row.innerHTML = `
        <div class="flex-shrink-0"><input type="checkbox" id="chk-${customId}" ${checked ? 'checked' : ''} class="w-6 h-6 text-green-500 rounded bg-gray-600 border-gray-500"></div>
        <div class="flex-grow"><input type="text" id="item-${customId}" value="${name}" placeholder="Enter custom item name..." class="w-full text-sm bg-gray-600 border-none rounded text-white py-1 px-2"></div>
        <div class="flex-grow w-1/2"><input type="text" id="note-${customId}" value="${notes}" placeholder="Notes" class="w-full text-xs bg-gray-600 border-none rounded text-gray-200 py-1 px-2"></div>
        <button type="button" onclick="this.closest('[id^=custom-row]').remove()" class="flex-shrink-0 text-red-500 hover:text-red-700 font-bold text-xl px-2">×</button>
    `;
    container.appendChild(row);
}

export function extractChecklistData(type, container, activeChecklists = null) {
    const source = activeChecklists || checklists;
    const data = source[type];
    if (!data) return null;
    const sections = data.sections.map((section, secIdx) => ({
        title: section.title,
        items: section.items.map((item, itemIdx) => {
            const cb = document.getElementById(`chk-${type}-${secIdx}-${itemIdx}`);
            const note = document.getElementById(`note-${type}-${secIdx}-${itemIdx}`);
            return { name: item, checked: cb?.checked || false, notes: note?.value || '' };
        })
    }));
    const customContainer = document.getElementById('custom-items-container');
    const customItems = [];
    if (customContainer) {
        Array.from(customContainer.children).forEach(row => {
            const customId = row.id.replace('custom-row-', '');
            const nameEl = document.getElementById(`item-${customId}`);
            const cbEl = document.getElementById(`chk-${customId}`);
            const noteEl = document.getElementById(`note-${customId}`);
            if (nameEl?.value?.trim()) {
                customItems.push({ name: nameEl.value.trim(), checked: cbEl?.checked || false, notes: noteEl?.value || '' });
            }
        });
    }
    return { type, sections, customItems };
}

export function buildChecklistTableHTML(checklistData) {
    if (!checklistData) return '';
    let html = `<table class="inspection-table"><thead><tr><th class="w-8">OK</th><th>Item</th><th>Notes</th></tr></thead><tbody>`;
    checklistData.sections.forEach(section => {
        html += `<tr class="inspection-category-row"><td colspan="3">${section.title}</td></tr>`;
        section.items.forEach(item => {
            html += `<tr><td class="check-cell">${item.checked ? '✓' : ''}</td><td>${item.name}</td><td class="italic">${item.notes || ''}</td></tr>`;
        });
    });
    if (checklistData.customItems?.length) {
        html += `<tr class="inspection-category-row"><td colspan="3">Custom Items</td></tr>`;
        checklistData.customItems.forEach(item => {
            html += `<tr><td class="check-cell">${item.checked ? '✓' : ''}</td><td>${item.name}</td><td class="italic">${item.notes || ''}</td></tr>`;
        });
    }
    html += `</tbody></table>`;
    return html;
}
