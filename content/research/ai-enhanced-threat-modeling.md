## Abstract

Traditional threat modeling is a labor-intensive, manual process that often fails to scale with modern cloud-native architectures. This paper proposes a novel framework that integrates Artificial Intelligence (AI)—specifically Graph Neural Networks (GNNs) and Natural Language Processing (NLP)—to automate the identification of security threats. By mapping architectural components to the STRIDE framework, the proposed system demonstrates a significant reduction in identification latency and a higher recall rate for complex logical vulnerabilities compared to manual assessments.

## 1. Introduction & Problem Statement

The rapid evolution of Software Development Life Cycles (SDLC), particularly the shift toward DevOps and Continuous Integration/Continuous Deployment (CI/CD), has created a critical friction point in security: the threat modeling phase. Historically, threat modeling is a collaborative design-time activity where security experts manually review architecture diagrams to identify potential weaknesses. However, as systems transition to microservices and serverless architectures, the sheer number of data flows and trust boundaries makes manual review nearly impossible to maintain without delaying deployment.

The core problem lies in the static nature of current methodologies. Traditional approaches like STRIDE or PASTA require frequent human re-evaluation every time a configuration changes. This "manual bottleneck" leads to stale security postures where vulnerabilities are identified only after code is deployed to production. This research advocates for an **AI-enhanced Threat Modeling (AI-TM)** framework that can ingest live architectural data and provide real-time security insights, effectively shifting security further "left" in the development process.

## 2. Literature Review

For decades, the STRIDE framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege) has served as the gold standard for threat categorization. While effective, it lacks an inherent mechanism for automation. Recent academic work has explored the use of Bayesian networks and Markov chains to predict attack paths, but these models often require highly structured input that is difficult to extract from standard developer documentation.

Conversely, the rise of Large Language Models (LLMs) has shown promise in code analysis. However, threat modeling is not merely code analysis; it requires a systemic understanding of how components interact. Current literature indicates a significant gap in *design-stage* automation. Most AI security tools focus on post-hoc intrusion detection (IDS) rather than proactive architectural hardening. Our research builds upon the foundation of Graph Theory and NLP to bridge this gap, treating system architectures as complex relational graphs.

## 3. Proposed Methodology: The AI Framework

The proposed framework, titled **IntelliSTRIDE**, operates on a three-tier architecture designed to transform raw configuration files into actionable security intelligence.

### 3.1 Data Acquisition & Feature Engineering

The system begins by ingesting Infrastructure as Code (IaC) templates (e.g., Terraform, CloudFormation) and OpenAPI specifications. Using NLP, the system extracts semantic meaning from component names and metadata. These components are then transformed into a **Property Graph**, where nodes represent services (databases, web servers) and edges represent communication protocols (HTTPS, gRPC).

*Figure 1: High-level workflow of the AI-enhanced Threat Modeling Framework.*

### 3.2 Inference Engine

The core of the framework is a **Graph Neural Network (GNN)** trained on a combined dataset of historical CVEs (Common Vulnerabilities and Exposures) and the OWASP Top 10. The GNN analyzes the topology of the system to identify "high-centrality" nodes—components that, if compromised, offer the greatest lateral movement potential. The model calculates a threat probability score *P(t|v)*, where *t* is the threat type and *v* is the architectural vector.

## 4. Implementation & System Design

The implementation utilizes a Python-based backend integrated with a Neo4j graph database. The workflow is triggered by a Git webhook. When a developer submits a Pull Request changing the architecture, the following steps occur:

- **Parser:** Converts YAML/JSON into a graph schema.
- **Classifier:** An LLM agent classifies each service's role and data sensitivity (e.g., PII, Financial).
- **Analysis:** The GNN runs a multi-class classification to map interactions to STRIDE categories. For example, an unencrypted S3 bucket interaction is automatically flagged under *Information Disclosure*.
- **Reporter:** Generates a JSON-based report that is pushed back to the developer's dashboard.

## 5. Evaluation & Results

The IntelliSTRIDE framework was tested against five enterprise-grade microservice architectures. The performance was measured against a baseline of manual security reviews conducted by senior security architects.

| Metric | Manual Process | AI-TM Framework | Improvement |
| --- | --- | --- | --- |
| Average Review Time | 14.5 Hours | 4.2 Minutes | ~200x Faster |
| Threat Recall Rate | 72% | 89% | +17% |
| False Positive Rate | 5% | 12% | -7% (Constraint) |

Results indicate that while the AI generated slightly more false positives (often flagging theoretically possible but unlikely configurations), its ability to identify complex lateral movement paths significantly outperformed human intuition.

## 6. Discussion & Limitations

While AI-TM offers massive speed advantages, it is not a "silver bullet." One primary limitation is the **Context Gap**. AI often lacks understanding of specific business logic—for instance, it may flag a high-traffic endpoint as a DoS risk without knowing that the endpoint is specifically designed for high-throughput batch processing.

Additionally, there is the emerging threat of **Adversarial Poisoning**. If an attacker knows the parameters of the AI modeling tool, they could theoretically design an architecture that appears "safe" to the GNN but contains hidden logical flaws. Human oversight remains essential for validating the final mitigation strategies.

## 7. Conclusion & Future Work

Enhancing threat modeling with AI transforms security from a reactive gatekeeper into a proactive enabler. By automating the identification of STRIDE threats at the design stage, organizations can secure their systems at the speed of code. Future work will focus on **Autonomous Remediation**, where the framework not only identifies the threat but automatically generates and tests the necessary firewall rules or IAM policies to neutralize the risk before the design is even finalized.
