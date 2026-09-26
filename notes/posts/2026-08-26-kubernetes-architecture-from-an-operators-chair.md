---
type: case-study
title: "Kubernetes architecture, from an operator's chair"
dek: "The control plane explained through what actually breaks, and which component to blame when it does."
date: 2026-08-26
tags: [Kubernetes, Architecture, Operations]
# The "Your production note" prompts below are still placeholders.
# Replace them with your own incidents, then set draft: false to publish.
draft: true
---

Every Kubernetes diagram shows the same seven boxes. Very few explain which
box wakes you at 3am, or why the answer is almost always the same one.

{{svg:kubernetes-architecture}}

## One idea does most of the work

There is no service mesh of internal calls between components. **Nothing talks
to anything except the API server**, and the API server is the only process
that writes to etcd.

The scheduler doesn't tell the kubelet to start a pod. It writes a node name
onto the pod object. The kubelet — watching the API server for pods assigned
to it — notices and acts. The controller manager doesn't command anything
either; it watches for a gap between desired and actual state and writes an
object to close it.

Once you hold that, most failures sort themselves into two buckets: something
can't reach the API server, or something can but doesn't like what it sees.

## The control plane

**kube-apiserver** — the only door. Authentication, authorisation, admission,
validation, then persistence. Stateless, so you scale it horizontally.

> *Your production note: what you've seen when the API server is slow rather
> than down. Latency here doesn't fail loudly, it makes everything else look
> broken.*

**etcd** — the entire cluster state, and the component that most deserves your
attention. Quorum, disk latency, and backups that you have actually restored.

> *Your production note: etcd disk latency, defrag, or a restore you've done.
> This is the section that separates operators from readers.*

**kube-scheduler** — filters nodes, scores what's left, writes the binding.

> *Your production note: a scheduling decision that surprised you — taints,
> affinity, topology spread, or resource requests nobody had set.*

**kube-controller-manager** — dozens of reconcile loops in one binary.

**cloud-controller-manager** — where the cluster meets the provider. Load
balancers, routes, node lifecycle.

## The node

**kubelet** — the only thing on the node that talks to the API server. It
watches for pods bound to its node and makes the node match.

> *Your production note: what you've debugged here. Node NotReady, disk
> pressure, a runtime that stopped responding.*

**kube-proxy** — programs iptables or IPVS so a Service IP reaches a pod.

**container runtime** — containerd or CRI-O, driven over the CRI.

## What this means when something breaks

| Symptom | Where to look first |
|---|---|
| Nothing schedules anywhere | scheduler, or every node is unschedulable |
| One node stops taking pods | kubelet on that node |
| Service resolves but doesn't connect | kube-proxy, CNI |
| Everything is slow and nothing is down | API server latency, etcd disk |
| Pods stuck Terminating | finalizers, kubelet, runtime |

> *Your production note: one real incident, anonymised, walked through with
> this table. That's the paragraph people will remember.*

## What I'd tell someone learning this

*Your closing. What you wish you'd understood earlier — this is where the
piece stops being an explainer and becomes yours.*
