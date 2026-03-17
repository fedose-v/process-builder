// ═══════════════════════════════════════════════════════════
// SELECT / PROPERTIES
// ═══════════════════════════════════════════════════════════
function selectNode(id) {
  if (selectedNode) {
    var prev = document.getElementById(selectedNode);
    if (prev) prev.classList.remove('selected');
  }
  selectedNode = id;
  if (id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('selected');
    showProperties(id);
  } else {
    showProperties(null);
  }
}

function showProperties(id) {
  var title = document.getElementById('propTitle');
  var sub = document.getElementById('propSub');
  var body = document.getElementById('propBody');
  if (!id) {
    title.textContent = 'Properties';
    sub.textContent = 'Select a node to configure';
    body.innerHTML = '<div class="empty-panel">Click on any node to view and edit its properties here.</div>';
    return;
  }
  var node = nodes[id];
  var def = NODE_DEFS[node.type][node.subtype];
  title.textContent = def.icon + ' ' + def.label;
  sub.textContent = def.badge + ' · ' + node.id;
  body.innerHTML = buildPropsForm(node);
}

function buildPropsForm(node) {
  var html = '';

  html += '<div class="prop-group">' +
    '<div class="prop-label">Label</div>' +
    '<input class="prop-input" value="' + (node.config.label || '') + '" onchange="updateConfig(\'' + node.id + '\',\'label\',this.value)" />' +
    '</div>';

  if (node.type === 'trigger') {
    if (node.subtype === 'schedule') {
      html += '<div class="prop-group">' +
        '<div class="prop-label">Schedule</div>' +
        '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'cron\',this.value)">' +
          '<option value="Every hour"' + (node.config.cron === 'Every hour' ? ' selected' : '') + '>Every hour</option>' +
          '<option value="Every day 9:00"' + (node.config.cron === 'Every day 9:00' ? ' selected' : '') + '>Every day 9:00</option>' +
          '<option value="Every Monday 8:00"' + (node.config.cron === 'Every Monday 8:00' ? ' selected' : '') + '>Every Monday 8:00</option>' +
          '<option value="1st of month"' + (node.config.cron === '1st of month' ? ' selected' : '') + '>1st of month</option>' +
          '<option value="Custom cron"' + (node.config.cron === 'Custom cron' ? ' selected' : '') + '>Custom cron</option>' +
        '</select>' +
        '</div>';
    }
    if (node.subtype === 'event_deal') {
      html += '<div class="prop-group">' +
        '<div class="prop-label">From Stage</div>' +
        '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'fromStage\',this.value)">' +
          '<option>Any</option><option>New</option><option>Contacted</option><option>Proposal</option><option>Negotiation</option>' +
        '</select>' +
        '</div>' +
        '<div class="prop-group">' +
        '<div class="prop-label">To Stage</div>' +
        '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'toStage\',this.value)">' +
          '<option>Any</option><option>Contacted</option><option>Proposal</option><option>Negotiation</option><option>Won</option><option>Lost</option>' +
        '</select>' +
        '</div>';
    }
    if (node.subtype === 'webhook') {
      html += '<div class="prop-group">' +
        '<div class="prop-label">Webhook URL (readonly)</div>' +
        '<input class="prop-input" readonly value="https://crm.example.com/hooks/' + node.id + '" style="color:#64748b;font-size:11px;" />' +
        '</div>';
    }
    if (node.subtype === 'event_lead' || node.subtype === 'event_form') {
      var sources = ['Any', 'Website', 'Social', 'Referral', 'Ad Campaign'];
      html += '<div class="prop-group">' +
        '<div class="prop-label">Source Filter</div>' +
        '<div class="tag-list">' +
          sources.map(function(s) {
            return '<span class="tag ' + (node.config.source === s ? 'active' : '') + '" onclick="updateConfig(\'' + node.id + '\',\'source\',\'' + s + '\');this.closest(\'.tag-list\').querySelectorAll(\'.tag\').forEach(function(t){t.classList.remove(\'active\')});this.classList.add(\'active\')">' + s + '</span>';
          }).join('') +
        '</div>' +
        '</div>';
    }
  }

  if (node.subtype === 'send_email') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Template</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'template\',this.value)">' +
        '<option value="">Select template...</option>' +
        '<option>Welcome Email</option><option>Follow-up #1</option><option>Demo Invite</option><option>Proposal Sent</option><option>Win Confirmation</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">From</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'from\',this.value)">' +
        '<option>Account owner</option><option>sales@company.com</option><option>support@company.com</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Delay (optional)</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'delay\',this.value)">' +
        '<option>Immediately</option><option>After 1 hour</option><option>After 1 day</option><option>After 3 days</option>' +
      '</select>' +
      '</div>';
  }

  if (node.subtype === 'send_sms') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Message</div>' +
      '<textarea class="prop-textarea" onchange="updateConfig(\'' + node.id + '\',\'message\',this.value)" placeholder="Hi {{contact.name}}, ...">' + (node.config.message || '') + '</textarea>' +
      '<div style="font-size:10px;color:#64748b;margin-top:4px;">Variables: {{contact.name}}, {{deal.value}}</div>' +
      '</div>';
  }

  if (node.subtype === 'create_task') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Task Title</div>' +
      '<input class="prop-input" value="' + (node.config.taskTitle || '') + '" placeholder="Call the lead..." onchange="updateConfig(\'' + node.id + '\',\'taskTitle\',this.value)" />' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Assign To</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'assignee\',this.value)">' +
        '<option>Account owner</option><option>Any sales rep</option><option>John Smith</option><option>Maria Garcia</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Due In</div>' +
      '<select class="prop-select">' +
        '<option>1 hour</option><option>Same day</option><option>Next day</option><option>3 days</option><option>1 week</option>' +
      '</select>' +
      '</div>';
  }

  if (node.subtype === 'update_field') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Field</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'field\',this.value)">' +
        '<option>Lead Status</option><option>Lead Score</option><option>Assignee</option><option>Priority</option><option>Custom Field 1</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">New Value</div>' +
      '<input class="prop-input" value="' + (node.config.value || '') + '" placeholder="Value or {{variable}}" onchange="updateConfig(\'' + node.id + '\',\'value\',this.value)" />' +
      '</div>';
  }

  if (node.subtype === 'add_tag') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Tags to Add</div>' +
      '<div class="tag-list">' +
        ['Hot Lead', 'Interested', 'Demo Scheduled', 'Pricing Sent', 'VIP'].map(function(t) {
          return '<span class="tag" onclick="this.classList.toggle(\'active\')">' + t + '</span>';
        }).join('') +
      '</div>' +
      '</div>';
  }

  if (node.subtype === 'notify') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Message</div>' +
      '<textarea class="prop-textarea" placeholder="New deal created: {{deal.name}}" onchange="updateConfig(\'' + node.id + '\',\'message\',this.value)">' + (node.config.message || '') + '</textarea>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Notify</div>' +
      '<select class="prop-select">' +
        '<option>Account owner</option><option>All sales reps</option><option>Specific user</option>' +
      '</select>' +
      '</div>';
  }

  if (node.subtype === 'move_stage') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Target Stage</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'stage\',this.value)">' +
        '<option>New</option><option>Contacted</option><option>Proposal</option><option>Negotiation</option><option>Won</option><option>Lost</option>' +
      '</select>' +
      '</div>';
  }

  if (node.subtype === 'webhook_call') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Method</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'method\',this.value)">' +
        '<option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">URL</div>' +
      '<input class="prop-input" value="' + (node.config.url || '') + '" placeholder="https://api.example.com/..." onchange="updateConfig(\'' + node.id + '\',\'url\',this.value)" />' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Body (JSON)</div>' +
      '<textarea class="prop-textarea" style="font-family:monospace;font-size:11px;" placeholder=\'{"contact_id": "{{contact.id}}"}\' onchange="updateConfig(\'' + node.id + '\',\'body\',this.value)">' + (node.config.body || '') + '</textarea>' +
      '</div>';
  }

  if (node.subtype === 'if_else') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Field</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'condField\',this.value)">' +
        '<option>Lead Score</option><option>Lead Status</option><option>Deal Value</option><option>Tag contains</option><option>Custom Field</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Operator</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'operator\',this.value)">' +
        '<option>equals</option><option>not equals</option><option>greater than</option><option>less than</option><option>contains</option><option>is empty</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Value</div>' +
      '<input class="prop-input" value="' + (node.config.condValue || '') + '" placeholder="e.g. 80" onchange="updateConfig(\'' + node.id + '\',\'condValue\',this.value)" />' +
      '</div>' +
      '<div style="background:#f59e0b11;border:1px solid #f59e0b33;border-radius:8px;padding:10px;font-size:11px;color:#94a3b8;margin-top:8px;">' +
        '<strong style="color:#f59e0b">Yes</strong> = condition is true<br>' +
        '<strong style="color:#ef4444">No</strong> = condition is false' +
      '</div>';
  }

  if (node.subtype === 'wait_time') {
    html += '<div class="prop-group">' +
      '<div class="prop-label">Wait Type</div>' +
      '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'waitType\',this.value)">' +
        '<option>Fixed Duration</option><option>Until Date/Time</option><option>Until Event</option>' +
      '</select>' +
      '</div>' +
      '<div class="prop-group">' +
      '<div class="prop-label">Duration</div>' +
      '<div style="display:flex;gap:8px">' +
        '<input class="prop-input" type="number" value="1" min="1" style="width:70px" onchange="updateConfig(\'' + node.id + '\',\'durValue\',this.value)" />' +
        '<select class="prop-select" onchange="updateConfig(\'' + node.id + '\',\'durUnit\',this.value)">' +
          '<option>minutes</option><option>hours</option><option>days</option><option>weeks</option>' +
        '</select>' +
      '</div>' +
      '</div>';
  }

  html += '<button class="delete-node-btn" onclick="deleteNode(\'' + node.id + '\')">🗑 Delete Node</button>';
  return html;
}

function updateConfig(nodeId, key, value) {
  if (!nodes[nodeId]) return;
  nodes[nodeId].config[key] = value;
  var el = document.getElementById(nodeId);
  if (el) {
    el.remove();
    renderNode(nodes[nodeId]);
    selectNode(nodeId);
    renderConnections();
  }
}
