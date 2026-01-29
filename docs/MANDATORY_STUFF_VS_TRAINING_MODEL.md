# Deadline vs Training Opportunity: Model Options

## Current state

- **CompanyTraining** today supports both:
  - **Training opportunity** (scheduled): `trainingDate`, `startTime`, `endTime`
  - **Training requirement with deadline** (self-paced): `completionDeadline`, `isSelfPaced`
- So the *shape* does allow for deadline vs opportunity; we’re overloading one model.

## Option A: Keep current shape (one model)

- **CompanyTraining** = training events **or** self-paced training with deadline.
- Pros: One place for all training; already built; no new APIs/UI.
- Cons: “Training” means two different things (event vs compliance obligation); harder to add non-training mandatory items later.

## Option B: Separate model — CompanyMandatoryStuff

- **CompanyTraining** = training **opportunities** only (scheduled sessions or self-paced courses as content). No required “due date” on the model; optional `completionDeadline` only if you want to show “complete by” on the training card.
- **CompanyMandatoryStuff** = a **compliance obligation**: “do this by this date.”
  - `dueDate` (deadline)
  - `type`: e.g. `TRAINING_COMPLETION` | `FORM_SUBMISSION` | `POLICY_ACKNOWLEDGMENT` | `OTHER`
  - `title`, `description`, `sponsoringOffice`, `link`
  - Optional `companyTrainingId`: if “complete this training by X” → link to the training
  - `companyId`, `workMeId`, `status`, etc.

Example: “OPM Performance Management training by Feb 9” could be:

- One **CompanyMandatoryStuff**: dueDate Feb 9, type TRAINING_COMPLETION, title/description/link (and optionally `companyTrainingId` if we also create a CompanyTraining for the course).

Pros:

- Clear separation: **deadline** (mandatory stuff) vs **opportunity** (training event/course).
- Mandatory/compliance is first-class; can add forms, policy acks, etc. without overloading training.
- List view can have a “Mandatory” category and sort by `dueDate`.

Cons:

- New model + APIs + UI; ingest may create both a training and a mandatory item when appropriate.

## Recommendation

- **Short term:** Current shape is fine; we can keep using `completionDeadline` + `isSelfPaced` on CompanyTraining and fix the list API to use `completionDeadline` for `startDate` when `isSelfPaced` is true.
- **If you want deadlines/compliance as a first-class concept:** Add **CompanyMandatoryStuff** and use it for “complete by X” items; keep CompanyTraining for opportunities. Not too much—it’s the right abstraction if you expect more mandatory types later.
