/**
 * CivicPulse — RoutingAgent
 * Maps ticket to department/ward, assigns SLA deadline based on
 * issue_type + department's historical avg resolution time.
 */
import BaseAgent from './BaseAgent.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pointInPolygon, calculateSlaDeadline } from '../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wardData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/ward-boundaries.json'), 'utf-8'));
const deptData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/departments.json'), 'utf-8'));

class RoutingAgent extends BaseAgent {
  constructor() {
    super('RoutingAgent');
  }

  /**
   * @param {object} context
   * @param {string} context.issue_type - Classified issue type
   * @param {{ lat: number, lng: number }} context.location - Ticket location
   * @param {number} context.severity_score - Issue severity
   * @returns {Promise<object>} Routing result: department, ward, SLA, assigned official
   */
  async execute(context) {
    const { issue_type, location, severity_score } = context;

    // Step 1: Determine ward from location
    const ward = this._findWard(location);

    // Step 2: Find the right department for this issue type
    const department = this._findDepartment(issue_type);

    // Step 3: Calculate SLA deadline
    // Adjust SLA based on severity: high severity = tighter SLA
    let slaHours = department.sla_hours;
    if (severity_score >= 8) {
      slaHours = Math.max(slaHours * 0.5, 12); // 50% of normal SLA, minimum 12h
    } else if (severity_score >= 6) {
      slaHours = Math.max(slaHours * 0.75, 24); // 75% of normal SLA
    }
    const slaDeadline = calculateSlaDeadline(slaHours);

    // Step 4: Assign an official (round-robin from department officials)
    const assignedOfficial = department.officials[
      Math.floor(Math.random() * department.officials.length)
    ];

    return {
      department: department.id,
      department_name: department.name,
      ward: ward?.id || 'unassigned',
      ward_name: ward?.name || 'Unknown Ward',
      sla_deadline: slaDeadline,
      sla_hours: slaHours,
      assigned_official_id: assignedOfficial,
      newStatus: 'active',
      reasoning: `Routed to ${department.name} in ${ward?.name || 'Unknown Ward'}. SLA: ${slaHours}h (adjusted for severity ${severity_score}/10). Assigned to official ${assignedOfficial}.`,
      confidence_score: ward ? 0.95 : 0.6,
    };
  }

  /**
   * Find which ward a location falls in using point-in-polygon
   */
  _findWard(location) {
    if (!location || !location.lat || !location.lng) return null;

    for (const ward of wardData.wards) {
      const polygon = ward.boundary.coordinates[0]; // First ring of the polygon
      if (pointInPolygon(location.lat, location.lng, polygon)) {
        return ward;
      }
    }

    // If no ward matches, find nearest ward by centroid distance
    let nearest = null;
    let minDist = Infinity;
    for (const ward of wardData.wards) {
      const coords = ward.boundary.coordinates[0];
      const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const dist = Math.sqrt((location.lat - centroidLat) ** 2 + (location.lng - centroidLng) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = ward;
      }
    }
    return nearest;
  }

  /**
   * Find department responsible for a given issue type
   */
  _findDepartment(issueType) {
    const dept = deptData.departments.find((d) => d.issue_types.includes(issueType));
    return dept || deptData.departments.find((d) => d.id === 'general');
  }
}

export default new RoutingAgent();
