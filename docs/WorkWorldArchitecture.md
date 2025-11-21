# WorkWorld Architecture

## Overview

WorkWorld is composed of four interconnected products:

### 1. WorkMe — Personal OS

Individual identity container (WORKMEID), tasks, goals, achievements, personal projects, NTK generator, and private career development.

### 2. WorkSpace — Collaboration Layer

Small-team collaboration spaces. Users can collaborate without onboarding into the full WorkMe identity model. Similar to RunCrew pattern. Workspaces are scoped to a project, not a company.

### 3. WorkConnect — Professional & Company Graph

Internal LinkedIn + org directory. Stores CompanyRegistry, CompanyUnits, org roles, internal announcements, enterprise events, mentorship relationships, org charts, and networking graph.

### 4. WorkComms — Enterprise Communications Engine

Specialized communication layer for official updates, NTKs, signage, training events, deadlines, surveys, and distribution to CompanyUnits. WorkComms publishes into WorkConnect.

## Identity Model Summary

- WORKMEID: Universal personal identity container.

- Workplace: Link between a user (WORKMEID) and a specific company.

- CompanyRegistry: Global company-level anchor.

- CompanyUnit: Subdivision (HQ, directorates, departments).

- CompanyRole: Defines permissions inside a company or unit.

- NetworkEdges (future): Person-to-person graph for mentorship, collaboration, org mapping.

## Core Principles

- Personal identity is separate from company identity.

- Collaboration is separate from employment.

- Organizing content by company and unit provides clear routing for comms.

- WorkComms is the producer; WorkConnect is the consumer.

- WorkMe and WorkSpace operate independently until user intentionally enters the company/person graph.

